/**
 * ─── PayDunya API Client ──────────────────────────────────────────────────────
 *
 * Variables d'environnement requises :
 *   PAYDUNYA_BASE_URL        → https://app.paydunya.com/api/v1 (live)
 *                              https://app.paydunya.com/sandbox-api/v1 (test)
 *   PAYDUNYA_MASTER_KEY      → Clé Principale
 *   PAYDUNYA_PRIVATE_KEY     → Clé Privée
 *   PAYDUNYA_TOKEN           → Token
 *   PAYDUNYA_WEBHOOK_SECRET  → (optionnel) secret pour vérifier les callbacks
 */

import crypto from "crypto";

export interface PayDunyaConfig {
  baseUrl: string;
  masterKey: string;
  privateKey: string;
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
      "Content-Type":          "application/json",
      "PAYDUNYA-MASTER-KEY":   this.config.masterKey,
      "PAYDUNYA-PRIVATE-KEY":  this.config.privateKey,
      "PAYDUNYA-TOKEN":        this.config.token,
    };
  }

  // ─── HTTP helper — gère les réponses HTML (erreurs proxy/auth) ────────────
  private async request<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    body?: object
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });

    const rawText = await response.text();

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Log the raw response to help diagnose key/URL mismatches
      console.error(
        `[PayDunya] Réponse non-JSON HTTP ${response.status} sur ${url}\n` +
        `Raw (500 chars): ${rawText.slice(0, 500)}`
      );
      throw new PayDunyaError(
        `PayDunya a renvoyé une réponse non-JSON (HTTP ${response.status}). ` +
        `URL utilisée : ${url}. ` +
        `Vérifiez que PAYDUNYA_BASE_URL correspond au mode de vos clés (live vs sandbox).`,
        response.status,
        { raw_text: rawText.slice(0, 500), url }
      );
    }

    if (!response.ok) {
      throw new PayDunyaError(
        data?.response_text ?? data?.message ?? `PayDunya API error ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  }

  // ─── Operator → PayDunya softpay slug mapping ────────────────────────────
  // PayDunya requires a two-step flow for mobile money:
  //   1. POST /checkout-invoice/create  → creates the invoice, returns a token
  //   2. POST /softpay/{slug}           → triggers the USSD/SMS prompt on the phone
  // Without step 2, the customer never receives any notification.
  private getSoftpaySlug(operator: string, countryCode: string): string | null {
    const key = `${operator.toLowerCase()}|${countryCode.toUpperCase()}`;
    const map: Record<string, string> = {
      // Togo
      "tmoney|TG":            "tmoney",
      "t-money|TG":           "tmoney",
      "moov money|TG":        "flooz",
      "moov|TG":              "flooz",
      "flooz|TG":             "flooz",
      // Bénin
      "mtn mobile money|BJ":  "mtn-benin",
      "mtn|BJ":               "mtn-benin",
      "moov money|BJ":        "flooz",
      "moov|BJ":              "flooz",
      // Côte d'Ivoire
      "mtn|CI":               "mtn-cote-divoire",
      "mtn mobile money|CI":  "mtn-cote-divoire",
      "orange money|CI":      "orange-money-cote-divoire",
      "orange|CI":            "orange-money-cote-divoire",
      "wave|CI":              "wave-cote-divoire",
      "moov money|CI":        "flooz",
      "moov|CI":              "flooz",
      // Sénégal
      "orange money|SN":      "orange-money-senegal",
      "orange|SN":            "orange-money-senegal",
      "wave|SN":              "wave-senegal",
      // Burkina Faso
      "orange money|BF":      "orange-money-burkina",
      "orange|BF":            "orange-money-burkina",
      "moov money|BF":        "flooz",
      "moov|BF":              "flooz",
      // Mali
      "orange money|ML":      "orange-money-mali",
      "orange|ML":            "orange-money-mali",
      "moov money|ML":        "flooz",
      "moov|ML":              "flooz",
      // Cameroun
      "mtn momo|CM":          "mtn-cameroun",
      "mtn|CM":               "mtn-cameroun",
      "orange money|CM":      "orange-money-cameroun",
      "orange|CM":            "orange-money-cameroun",
    };
    return map[key] ?? null;
  }

  // ─── Initiate Pay-In: create invoice then trigger softpay prompt ──────────
  // Step 1: POST /checkout-invoice/create  → invoice token
  // Step 2: POST /softpay/{slug}           → push USSD/SMS prompt to phone
  async initiatePayin(params: PayDunyaPayinRequest): Promise<PayDunyaPayinResponse> {
    // Step 1 — create the checkout invoice
    const raw = await this.request<any>("POST", "/checkout-invoice/create", {
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

    if (raw.response_code !== "00" || !raw.token) {
      return {
        success:            false,
        paydunya_reference: raw.token ?? "",
        token:              raw.token,
        payment_url:        raw.invoice_url ?? raw.payment_url ?? null,
        status:             "failed",
        message:            raw.response_text ?? raw.message ?? "Échec création facture PayDunya",
      };
    }

    const invoiceToken: string = raw.token;
    const paymentUrl: string | null = raw.invoice_url ?? raw.payment_url ?? null;

    // Step 2 — trigger the mobile money prompt on the customer's phone
    const softpaySlug = this.getSoftpaySlug(params.operator, params.country_code);

    if (softpaySlug) {
      try {
        const softpayRaw = await this.request<any>("POST", `/softpay/${softpaySlug}`, {
          token:        invoiceToken,
          phone_number: params.phone,
        });

        // PayDunya returns response_code "00" on success
        const softpaySuccess = softpayRaw.response_code === "00";

        if (!softpaySuccess) {
          return {
            success:            false,
            paydunya_reference: invoiceToken,
            token:              invoiceToken,
            payment_url:        paymentUrl,
            status:             "failed",
            message:            softpayRaw.response_text ?? softpayRaw.message ?? "Échec envoi prompt mobile money",
          };
        }
      } catch (err: any) {
        // Softpay failure is a hard failure — the customer's phone got nothing
        return {
          success:            false,
          paydunya_reference: invoiceToken,
          token:              invoiceToken,
          payment_url:        paymentUrl,
          status:             "failed",
          message:            err?.message ?? "Erreur lors du déclenchement du prompt mobile money",
        };
      }
    } else {
      // No known softpay slug — fall back to hosted payment page only
      // The customer will need to visit payment_url to complete payment
      console.warn(
        `[PayDunya] Aucun slug softpay pour l'opérateur "${params.operator}" (${params.country_code}). ` +
        `L'utilisateur devra payer via la page hébergée: ${paymentUrl}`
      );
    }

    return {
      success:            true,
      paydunya_reference: invoiceToken,
      token:              invoiceToken,
      payment_url:        paymentUrl,
      status:             "pending",
      message:            softpaySlug
        ? "Prompt mobile money envoyé sur le téléphone du client"
        : "Facture créée — le client doit valider via la page de paiement",
    };
  }

  // ─── Initiate Pay-Out ─────────────────────────────────────────────────────
  // NOTE: PayDunya's direct pay (payout) API endpoint is not available on the
  // standard REST path. Payout via PayDunya must be configured separately or
  // handled via Clapay. This method will throw a clear error.
  async initiatePayout(_params: PayDunyaPayoutRequest): Promise<PayDunyaPayoutResponse> {
    throw new PayDunyaError(
      "Le payout via PayDunya n'est pas disponible sur cet endpoint. Configurez Clapay pour les payouts ou contactez PayDunya pour activer le Direct Pay API.",
      503,
      { code: "PAYOUT_NOT_SUPPORTED" },
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
  parseWebhookEvent(body: any): PayDunyaWebhookPayload {
    const invoice    = body.invoice ?? body;
    const customData = body.custom_data ?? {};
    const status     = this.mapStatus(invoice.status ?? body.status ?? "");

    return {
      event:               body.event_type ?? (status === "completed" ? "payin.success" : "payin.failed"),
      paydunya_reference:  invoice.token ?? body.token ?? body.paydunya_reference ?? "",
      our_reference:       customData.drimpay_reference ?? body.external_reference ?? body.our_reference ?? "",
      status,
      amount:              parseFloat(invoice.total_amount ?? body.amount ?? "0"),
      currency:            invoice.currency ?? body.currency ?? "XOF",
      operator:            customData.operator ?? body.operator ?? "unknown",
      phone:               customData.phone    ?? body.phone    ?? "",
      country_code:        customData.country_code ?? body.country_code ?? "",
      failure_reason:      invoice.fail_reason ?? body.failure_reason,
      completed_at:        invoice.completed_at ?? body.completed_at,
      timestamp:           body.timestamp ?? Math.floor(Date.now() / 1000),
      hash:                body.hash,
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
    public readonly raw: any
  ) {
    super(message);
    this.name = "PayDunyaError";
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────
let _client: PayDunyaClient | null = null;

// Default URLs — override with PAYDUNYA_BASE_URL env var if needed
const PAYDUNYA_LIVE_URL    = "https://app.paydunya.com/api/v1";
const PAYDUNYA_SANDBOX_URL = "https://app.paydunya.com/sandbox-api/v1";

export function getPayDunyaClient(): PayDunyaClient {
  if (!_client) {
    // Default to live URL; set PAYDUNYA_BASE_URL=https://app.paydunya.com/sandbox-api/v1 for sandbox
    const baseUrl       = process.env.PAYDUNYA_BASE_URL ?? PAYDUNYA_LIVE_URL;
    const masterKey     = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey    = process.env.PAYDUNYA_PRIVATE_KEY;
    const token         = process.env.PAYDUNYA_TOKEN;
    const webhookSecret = process.env.PAYDUNYA_WEBHOOK_SECRET ?? "placeholder-secret";

    if (!masterKey || !privateKey || !token) {
      throw new Error(
        "PayDunya non configuré. Définissez PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY et PAYDUNYA_TOKEN dans les secrets."
      );
    }

    const isSandbox = baseUrl.includes("sandbox");
    console.log(`[PayDunya] Mode : ${isSandbox ? "SANDBOX" : "LIVE"} | URL : ${baseUrl}`);

    _client = new PayDunyaClient({ baseUrl, masterKey, privateKey, token, webhookSecret });
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
