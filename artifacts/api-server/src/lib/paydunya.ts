/**
 * ─── PayDunya API Client ──────────────────────────────────────────────────────
 *
 * Variables d'environnement requises :
 *   PAYDUNYA_MASTER_KEY      → Clé Principale
 *   PAYDUNYA_PRIVATE_KEY     → Clé Privée
 *   PAYDUNYA_PUBLIC_KEY      → Clé Publique
 *   PAYDUNYA_TOKEN           → Token
 *
 * Optionnel :
 *   PAYDUNYA_BASE_URL        → https://app.paydunya.com/api/v1 (défaut live)
 *                              https://app.paydunya.com/sandbox-api/v1 (sandbox)
 *   PAYDUNYA_WEBHOOK_SECRET  → secret pour vérifier les callbacks
 *
 * Flow SoftPay (PSR — Paiement Sans Redirection) :
 *   1. POST /checkout-invoice/create  → response.token (= payment_token)
 *   2. POST /softpay/{slug}           → payload spécifique à chaque opérateur
 *      champ token = "payment_token" (pas "token")
 *      slug et payload définis dans paydunya-softpay-map.ts
 */

import crypto from "crypto";
import { getSoftPayConfig, type SoftPayParams } from "./paydunya-softpay-map.js";

export interface PayDunyaConfig {
  baseUrl: string;
  masterKey: string;
  privateKey: string;
  publicKey: string;
  token: string;
  webhookSecret: string;
}

export interface PayDunyaPayinRequest {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  order_id: string;
  callback_url: string;
  return_url?: string;
  cancel_url?: string;
  description?: string;
  customer_name?: string;
  customer_email?: string;
}

export interface PayDunyaPayinResponse {
  success: boolean;
  paydunya_reference: string;
  token?: string;
  payment_url?: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  message?: string;
}

export interface PayDunyaPayoutRequest {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  description?: string;
  callback_url: string;
}

export interface PayDunyaPayoutResponse {
  success: boolean;
  paydunya_reference: string;
  status: "pending" | "processing" | "completed" | "failed";
  message?: string;
}

export interface PayDunyaStatusResponse {
  paydunya_reference: string;
  our_reference: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  amount: number;
  currency: string;
  operator: string;
  phone: string;
  failure_reason?: string;
  completed_at?: string;
}

export interface PayDunyaWebhookPayload {
  event: string;
  paydunya_reference: string;
  our_reference: string;
  status: string;
  amount: number;
  currency: string;
  operator: string;
  phone: string;
  country_code: string;
  failure_reason?: string;
  completed_at?: string;
  timestamp: number;
  hash?: string;
}

export class PayDunyaClient {
  private config: PayDunyaConfig;

  constructor(config: PayDunyaConfig) {
    this.config = config;
  }

  // ─── Auth headers ─────────────────────────────────────────────────────────
  private headers(): Record<string, string> {
    return {
      "Accept":                "application/json",
      "Content-Type":          "application/json",
      "PAYDUNYA-MASTER-KEY":   this.config.masterKey,
      "PAYDUNYA-PRIVATE-KEY":  this.config.privateKey,
      "PAYDUNYA-PUBLIC-KEY":   this.config.publicKey,
      "PAYDUNYA-TOKEN":        this.config.token,
    };
  }

  // ─── HTTP helper — logs complets, détecte HTML, jamais crash ─────────────
  private async request<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    body?: object,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const startMs = Date.now();
    const sentHeaders = this.headers();

    console.log(`[PayDunya] → ${method} ${url}`);
    if (body) {
      console.log(`[PayDunya]   payload: ${JSON.stringify(body)}`);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: sentHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err: any) {
      // Network timeout or DNS failure — safe to retry
      const isTimeout = err?.name === "TimeoutError" || err?.code === "ETIMEDOUT";
      console.error(`[PayDunya] ✗ Network error (${method} ${url}): ${err?.message}`);
      throw new PayDunyaError(
        `Erreur réseau PayDunya : ${err?.message}`,
        isTimeout ? 408 : 503,
        { url, error: err?.message, retryable: true },
      );
    }

    const elapsed = Date.now() - startMs;
    const contentType = response.headers.get("content-type") ?? "";
    console.log(
      `[PayDunya] ← HTTP ${response.status} | content-type: ${contentType} | ${elapsed}ms`,
    );

    const rawText = await response.text();

    // ── Detect HTML response (login page / wrong endpoint / wrong slug) ─────
    if (contentType.includes("text/html") || rawText.trimStart().startsWith("<!DOCTYPE")) {
      const preview = rawText.slice(0, 300).replace(/\s+/g, " ").trim();
      console.error(
        `[PayDunya] ✗ HTML reçu au lieu de JSON sur ${url}\n` +
        `  Cause probable : endpoint incorrect, slug invalide, token expiré,\n` +
        `  ou fonctionnalité SoftPay non activée sur ce compte.\n` +
        `  Preview HTML : ${preview}`,
      );
      throw new PayDunyaError(
        "PayDunya a retourné une page HTML au lieu de JSON. " +
        "Vérifiez que le slug opérateur est correct et que le SoftPay est activé sur votre compte PayDunya.",
        response.status,
        { url, html_preview: preview, retryable: false },
      );
    }

    // ── Parse JSON ────────────────────────────────────────────────────────────
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      const preview = rawText.slice(0, 300);
      console.error(
        `[PayDunya] ✗ Réponse non-JSON (HTTP ${response.status}) sur ${url}\n` +
        `  Raw: ${preview}`,
      );
      throw new PayDunyaError(
        `PayDunya a retourné une réponse invalide (HTTP ${response.status}).`,
        response.status,
        { url, raw_preview: preview, retryable: false },
      );
    }

    console.log(`[PayDunya]   réponse JSON: ${JSON.stringify(data).slice(0, 400)}`);

    // ── HTTP error ────────────────────────────────────────────────────────────
    if (!response.ok) {
      const retryable = response.status >= 500;
      throw new PayDunyaError(
        data?.response_text ?? data?.message ?? `PayDunya API error ${response.status}`,
        response.status,
        { ...data, retryable },
      );
    }

    return data as T;
  }

  // ─── Initiate Pay-In: SoftPay PSR flow ────────────────────────────────────
  // Step 1 : POST /checkout-invoice/create  → response.token (= payment_token)
  // Step 2 : POST /softpay/{slug}           → operator-specific payload
  async initiatePayin(params: PayDunyaPayinRequest): Promise<PayDunyaPayinResponse> {

    // ── Step 1 — Create checkout invoice ─────────────────────────────────────
    console.log(`[PayDunya] Étape 1 — création facture | ref: ${params.reference}`);

    let raw: any;
    try {
      raw = await this.request<any>("POST", "/checkout-invoice/create", {
        invoice: {
          total_amount: params.amount,
          description:  params.description ?? `Paiement DrimPay ${params.reference}`,
        },
        store: {
          name:        "DrimPay",
          website_url: "https://drimpay.com",
        },
        actions: {
          cancel_url:   params.cancel_url  ?? "https://drimpay.com",
          return_url:   params.return_url  ?? "https://drimpay.com",
          callback_url: params.callback_url,
        },
        custom_data: {
          drimpay_reference: params.reference,
          order_id:          params.order_id,
          operator:          params.operator,
          phone:             params.phone,
          country_code:      params.country_code,
          currency:          params.currency,
        },
      });
    } catch (err: any) {
      return {
        success:            false,
        paydunya_reference: "",
        status:             "failed",
        message:            err?.message ?? "Erreur lors de la création de la facture PayDunya",
      };
    }

    if (raw.response_code !== "00" || !raw.token) {
      console.error(`[PayDunya] ✗ Étape 1 échouée — response_code: ${raw.response_code} | msg: ${raw.response_text}`);
      return {
        success:            false,
        paydunya_reference: raw.token ?? "",
        token:              raw.token,
        payment_url:        raw.invoice_url ?? raw.payment_url ?? null,
        status:             "failed",
        message:            raw.response_text ?? raw.message ?? "Échec création facture PayDunya",
      };
    }

    const paymentToken: string = raw.token;
    const paymentUrl:   string | null = raw.invoice_url ?? raw.payment_url ?? null;

    console.log(`[PayDunya] ✓ Étape 1 OK — payment_token: ${paymentToken} | payment_url: ${paymentUrl}`);

    // ── Step 2 — SoftPay: operator-specific USSD prompt ───────────────────────
    const softPayConfig = getSoftPayConfig(params.operator, params.country_code);

    if (!softPayConfig) {
      console.warn(
        `[PayDunya] ⚠ Aucune config SoftPay pour "${params.operator}" (${params.country_code}). ` +
        `Fallback sur la page de paiement hébergée: ${paymentUrl}`,
      );
      return {
        success:            true,
        paydunya_reference: paymentToken,
        token:              paymentToken,
        payment_url:        paymentUrl ?? undefined,
        status:             "pending",
        message:            "Facture créée — l'opérateur n'est pas encore supporté en SoftPay. " +
                            "Le client doit valider via la page de paiement.",
      };
    }

    const softPayParams: SoftPayParams = {
      paymentToken: paymentToken,
      phone:        params.phone,
      fullName:     params.customer_name ?? "Client DrimPay",
      email:        params.customer_email ?? "client@drimpay.com",
      address:      params.country_code === "TG" ? "Lomé" :
                    params.country_code === "BJ" ? "Cotonou" :
                    params.country_code === "CI" ? "Abidjan" :
                    params.country_code === "SN" ? "Dakar" :
                    params.country_code === "ML" ? "Bamako" :
                    params.country_code === "BF" ? "Ouagadougou" :
                    params.country_code === "CM" ? "Yaoundé" : undefined,
    };

    const softPayPayload = softPayConfig.buildPayload(softPayParams);
    const softPayPath    = `/softpay/${softPayConfig.slug}`;

    console.log(
      `[PayDunya] Étape 2 — SoftPay "${softPayConfig.label}" | endpoint: ${softPayPath}`,
    );

    let softRaw: any;
    try {
      softRaw = await this.request<any>("POST", softPayPath, softPayPayload);
    } catch (err: any) {
      console.error(`[PayDunya] ✗ Étape 2 SoftPay échouée: ${err?.message}`);

      // Non-retryable errors (HTML login page, invalid slug) → hard failure
      const raw = err as PayDunyaError;
      if (raw?.raw?.retryable === false) {
        return {
          success:            false,
          paydunya_reference: paymentToken,
          token:              paymentToken,
          payment_url:        paymentUrl ?? undefined,
          status:             "failed",
          message:            err?.message,
        };
      }

      // Retryable (network/5xx) → still fail cleanly, let client retry
      return {
        success:            false,
        paydunya_reference: paymentToken,
        token:              paymentToken,
        payment_url:        paymentUrl ?? undefined,
        status:             "failed",
        message:            err?.message ?? "Erreur réseau lors du déclenchement SoftPay",
      };
    }

    // PayDunya SoftPay success: response_code "00" OR success: true (selon l'opérateur)
    const softpayOk = softRaw.response_code === "00" || softRaw.success === true;
    if (!softpayOk) {
      console.error(
        `[PayDunya] ✗ SoftPay rejeté — code: ${softRaw.response_code} | success: ${softRaw.success} | msg: ${softRaw.response_text ?? softRaw.message}`,
      );
      return {
        success:            false,
        paydunya_reference: paymentToken,
        token:              paymentToken,
        payment_url:        paymentUrl ?? undefined,
        status:             "failed",
        message:            softRaw.response_text ?? softRaw.message ?? "Paiement SoftPay refusé",
      };
    }

    console.log(`[PayDunya] ✓ Étape 2 OK — prompt USSD envoyé sur ${params.phone}`);

    return {
      success:            true,
      paydunya_reference: paymentToken,
      token:              paymentToken,
      payment_url:        paymentUrl ?? undefined,
      status:             "pending",
      message:            `Prompt ${softPayConfig.label} envoyé sur le téléphone du client`,
    };
  }

  // ─── Initiate Pay-Out ─────────────────────────────────────────────────────
  async initiatePayout(_params: PayDunyaPayoutRequest): Promise<PayDunyaPayoutResponse> {
    throw new PayDunyaError(
      "Le payout via PayDunya n'est pas disponible sur cet endpoint. " +
      "Configurez Clapay pour les payouts ou contactez PayDunya pour activer le Direct Pay API.",
      503,
      { code: "PAYOUT_NOT_SUPPORTED", retryable: false },
    );
  }

  // ─── Get transaction status ───────────────────────────────────────────────
  async getStatus(paydunyaReference: string): Promise<PayDunyaStatusResponse> {
    const raw = await this.request<any>("GET", `/checkout-invoice/confirm/${paydunyaReference}`);

    const invoice    = raw.invoice ?? raw;
    const customData = raw.custom_data ?? {};
    const status     = this.mapStatus(invoice.status ?? raw.status);

    return {
      paydunya_reference: paydunyaReference,
      our_reference:      customData.drimpay_reference ?? raw.our_reference ?? "",
      status,
      amount:             parseFloat(invoice.total_amount ?? raw.amount ?? "0"),
      currency:           invoice.currency ?? raw.currency ?? "XOF",
      operator:           customData.operator ?? raw.operator ?? "unknown",
      phone:              customData.phone    ?? raw.phone    ?? "",
      failure_reason:     invoice.fail_reason ?? raw.failure_reason,
      completed_at:       invoice.completed_at ?? raw.completed_at,
    };
  }

  // ─── Verify webhook signature from PayDunya ───────────────────────────────
  verifyWebhookSignature(payload: string, receivedHash: string): boolean {
    const expected = crypto
      .createHash("sha512")
      .update(this.config.masterKey + payload)
      .digest("hex");
    return expected === receivedHash;
  }

  // ─── Parse webhook event from PayDunya ───────────────────────────────────
  // IMPORTANT : l'IPN "checkout-invoice" officielle de PayDunya envoie ses
  // champs sous une clé racine "data" (form-urlencoded `data[invoice][status]=...`,
  // `data[custom_data][drimpay_reference]=...`, `data[hash]=...`). Si on ne
  // "déballe" pas ce wrapper, `invoice`/`custom_data`/`our_reference` sont tous
  // vides, le webhook ne retrouve pas la transaction et l'abandonne — alors que
  // PayDunya a bien confirmé le paiement. On accepte donc les deux formats :
  // avec ou sans wrapper "data".
  parseWebhookEvent(body: any): PayDunyaWebhookPayload {
    const root       = (body && typeof body === "object" && body.data && typeof body.data === "object") ? body.data : (body ?? {});
    const invoice    = root.invoice ?? root;
    const customData = root.custom_data ?? {};
    const status     = this.mapStatus(invoice.status ?? root.status ?? "");

    return {
      event:               root.event_type ?? (status === "completed" ? "payin.success" : "payin.failed"),
      paydunya_reference:  invoice.token ?? root.token ?? root.paydunya_reference ?? "",
      our_reference:       customData.drimpay_reference ?? root.external_reference ?? root.our_reference ?? "",
      status,
      amount:              parseFloat(invoice.total_amount ?? root.amount ?? "0"),
      currency:            invoice.currency ?? root.currency ?? "XOF",
      operator:            customData.operator ?? root.operator ?? "unknown",
      phone:               customData.phone    ?? root.phone    ?? "",
      country_code:        customData.country_code ?? root.country_code ?? "",
      failure_reason:      invoice.fail_reason ?? root.failure_reason,
      completed_at:        invoice.completed_at ?? root.completed_at,
      timestamp:           root.timestamp ?? Math.floor(Date.now() / 1000),
      hash:                root.hash,
    };
  }

  // ─── Map PayDunya status strings to internal format ───────────────────────
  private mapStatus(raw: string): "pending" | "processing" | "completed" | "failed" | "cancelled" {
    switch ((raw ?? "").toLowerCase()) {
      case "completed":
      case "success":
      case "successful":
        return "completed";
      case "failed":
      case "failure":
      case "error":
        return "failed";
      case "cancelled":
      case "canceled":
        return "cancelled";
      case "processing":
      case "in_progress":
        return "processing";
      default:
        return "pending";
    }
  }
}

export class PayDunyaError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly raw: any,
  ) {
    super(message);
    this.name = "PayDunyaError";
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────
let _client: PayDunyaClient | null = null;

const PAYDUNYA_LIVE_URL    = "https://app.paydunya.com/api/v1";
const PAYDUNYA_SANDBOX_URL = "https://app.paydunya.com/sandbox-api/v1";

export function getPayDunyaClient(): PayDunyaClient {
  if (!_client) {
    const baseUrl       = process.env.PAYDUNYA_BASE_URL ?? PAYDUNYA_LIVE_URL;
    const masterKey     = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey    = process.env.PAYDUNYA_PRIVATE_KEY;
    const publicKey     = process.env.PAYDUNYA_PUBLIC_KEY ?? "";
    const token         = process.env.PAYDUNYA_TOKEN;
    const webhookSecret = process.env.PAYDUNYA_WEBHOOK_SECRET ?? "placeholder-secret";

    if (!masterKey || !privateKey || !token) {
      throw new Error(
        "PayDunya non configuré. Définissez PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, " +
        "PAYDUNYA_PUBLIC_KEY et PAYDUNYA_TOKEN dans les secrets.",
      );
    }

    const isSandbox = baseUrl.includes("sandbox");
    console.log(
      `[PayDunya] Mode : ${isSandbox ? "SANDBOX" : "LIVE"} | URL : ${baseUrl} | ` +
      `Master key : ${masterKey ? "✓" : "✗"} | ` +
      `Public key : ${publicKey ? "✓" : "✗ (PAYDUNYA_PUBLIC_KEY manquant)"}`,
    );

    _client = new PayDunyaClient({ baseUrl, masterKey, privateKey, publicKey, token, webhookSecret });
  }
  return _client;
}

export function isPayDunyaConfigured(): boolean {
  return !!(
    process.env.PAYDUNYA_MASTER_KEY &&
    process.env.PAYDUNYA_PRIVATE_KEY &&
    process.env.PAYDUNYA_TOKEN
  );
}
