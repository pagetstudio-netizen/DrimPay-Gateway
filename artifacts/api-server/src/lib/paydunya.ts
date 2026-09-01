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

// ─── Redact sensitive fields before logging ───────────────────────────────────
const SENSITIVE_KEYS = new Set([
  "phone", "account_alias", "email", "customer_email",
  "customer_phone", "customer_firstname", "customer_lastname", "customer_name",
  "name",
]);

function redactPayload(obj: object): object {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (SENSITIVE_KEYS.has(k) && typeof v === "string") return [k, "***"];
      if (v && typeof v === "object" && !Array.isArray(v)) return [k, redactPayload(v as object)];
      return [k, v];
    })
  );
}

// ─── Withdraw mode map (disbursement) ─────────────────────────────────────────
// Key: "{operator_normalized}|{COUNTRY_CODE}" — same convention as SOFTPAY_OPERATOR_MAP
// Value: withdraw_mode slug for POST /api/v2/disburse/get-invoice
const WITHDRAW_MODE_MAP: Record<string, string> = {
  // Togo
  "tmoney|TG":       "t-money-togo",
  "t-money|TG":      "t-money-togo",
  "moov money|TG":   "moov-togo",
  "moov|TG":         "moov-togo",
  "flooz|TG":        "moov-togo",
  // Bénin
  "mtn mobile money|BJ": "mtn-benin",
  "mtn momo|BJ":     "mtn-benin",
  "mtn|BJ":          "mtn-benin",
  "moov money|BJ":   "moov-benin",
  "moov|BJ":         "moov-benin",
  // Côte d'Ivoire
  "mtn|CI":               "mtn-ci",
  "mtn mobile money|CI":  "mtn-ci",
  "orange money|CI":      "orange-money-ci",
  "orange|CI":            "orange-money-ci",
  "wave|CI":              "wave-ci",
  "moov money|CI":        "moov-ci",
  "moov|CI":              "moov-ci",
  "djamo|CI":             "djamo-ci",
  // Sénégal
  "orange money|SN":      "orange-money-senegal",
  "orange|SN":            "orange-money-senegal",
  "wave|SN":              "wave-senegal",
  "free money|SN":        "free-money-senegal",
  "freemoney|SN":         "free-money-senegal",
  "expresso|SN":          "expresso-senegal",
  "e-money|SN":           "expresso-senegal",
  "emoney|SN":            "expresso-senegal",
  "djamo|SN":             "djamo-sn",
  // Mali
  "orange money|ML":      "orange-money-mali",
  "orange|ML":            "orange-money-mali",
  "moov money|ML":        "moov-mali",
  "moov|ML":              "moov-mali",
  // Burkina Faso
  "orange money|BF":      "orange-money-burkina",
  "orange|BF":            "orange-money-burkina",
  "moov money|BF":        "moov-burkina-faso",
  "moov|BF":              "moov-burkina-faso",
  // Cameroun
  "mtn momo|CM":          "mtn-cameroun",
  "mtn mobile money|CM":  "mtn-cameroun",
  "mtn|CM":               "mtn-cameroun",
  "orange money|CM":      "orange-money-cameroun",
  "orange|CM":            "orange-money-cameroun",
};

function getWithdrawMode(operator: string, countryCode: string): string | null {
  const key = `${operator.toLowerCase().trim()}|${countryCode.toUpperCase().trim()}`;
  return WITHDRAW_MODE_MAP[key] ?? null;
}

// ─── Country dial codes — to strip from phone for account_alias ───────────────
const COUNTRY_DIAL_CODES: Record<string, string> = {
  TG: "228", BJ: "229", CI: "225", SN: "221",
  ML: "223", BF: "226", CM: "237", GH: "233",
  GN: "224", SL: "232", LR: "231", NG: "234",
};

function stripCountryCode(phone: string, countryCode: string): string {
  const code = COUNTRY_DIAL_CODES[countryCode.toUpperCase()];
  let p = phone.replace(/\s+/g, "");
  if (code) {
    if (p.startsWith(`+${code}`)) return p.slice(1 + code.length);
    if (p.startsWith(`00${code}`)) return p.slice(2 + code.length);
    if (p.startsWith(code) && p.length > code.length + 5) return p.slice(code.length);
  }
  // Already local or unknown format — strip leading +/00 if present
  return p.replace(/^\+\d{1,4}/, "").replace(/^00\d{1,4}/, "");
}

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
  /** Code OTP/USSD saisi par le client (requis pour Orange Money CI/SN/BF en SoftPay). */
  operator_otp?: string;
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

  // ─── v2 base URL (for disbursement endpoints) ─────────────────────────────
  private get v2BaseUrl(): string {
    return this.config.baseUrl.includes("sandbox")
      ? "https://app.paydunya.com/sandbox-api/v2"
      : "https://app.paydunya.com/api/v2";
  }

  // ─── HTTP helper — logs complets, détecte HTML, jamais crash ─────────────
  private async request<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    body?: object,
    baseUrlOverride?: string,
  ): Promise<T> {
    const url = `${baseUrlOverride ?? this.config.baseUrl}${path}`;
    const startMs = Date.now();
    const sentHeaders = this.headers();

    console.log(`[PayDunya] → ${method} ${url}`);
    if (body) {
      console.log(`[PayDunya]   payload: ${JSON.stringify(redactPayload(body))}`);
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

    if (softPayConfig.requiresOtp && !params.operator_otp) {
      console.warn(
        `[PayDunya] ⚠ Code OTP manquant pour "${softPayConfig.label}" (${params.country_code}) — le client doit le générer via USSD.`,
      );
      return {
        success:            false,
        paydunya_reference: paymentToken,
        token:              paymentToken,
        payment_url:        paymentUrl ?? undefined,
        status:             "failed",
        message:            "Un code de confirmation Orange Money est requis pour ce pays. " +
                            "Composez le code USSD indiqué sur la page de paiement puis renseignez le code reçu.",
      };
    }

    const softPayParams: SoftPayParams = {
      paymentToken: paymentToken,
      phone:        params.phone,
      fullName:     params.customer_name ?? "Client DrimPay",
      email:        params.customer_email ?? "client@drimpay.com",
      otp:          params.operator_otp,
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

    // ── Wave (et tout opérateur "redirect flow") : PayDunya renvoie une URL
    //    (page Wave / deep-link) que le client doit ouvrir ou scanner en QR code,
    //    au lieu d'un push USSD confirmé directement sur le téléphone.
    if (softPayConfig.isRedirectFlow) {
      const waveUrl: string | undefined = softRaw.url ?? undefined;
      if (!waveUrl) {
        console.error(
          `[PayDunya] ✗ SoftPay "${softPayConfig.label}" — succès mais aucune URL de paiement retournée.`,
        );
        return {
          success:            false,
          paydunya_reference: paymentToken,
          token:              paymentToken,
          payment_url:        paymentUrl ?? undefined,
          status:             "failed",
          message:            "Réponse Wave invalide — aucun lien de paiement reçu.",
        };
      }
      console.log(`[PayDunya] ✓ Étape 2 OK — lien Wave: ${waveUrl}`);
      return {
        success:            true,
        paydunya_reference: paymentToken,
        token:              paymentToken,
        payment_url:        waveUrl,
        status:             "pending",
        message:            `Ouvrez ce lien dans l'application ${softPayConfig.label} pour finaliser le paiement`,
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

  // ─── Initiate Pay-Out (Disbursement) — API v2 two-step flow ──────────────
  // Step 1: POST /api/v2/disburse/get-invoice  → disburse_token
  // Step 2: POST /api/v2/disburse/submit-invoice → final status
  async initiatePayout(params: PayDunyaPayoutRequest): Promise<PayDunyaPayoutResponse> {
    const withdrawMode = getWithdrawMode(params.operator, params.country_code);
    if (!withdrawMode) {
      console.error(
        `[PayDunya] Payout — opérateur "${params.operator}" (${params.country_code}) ` +
        `non mappé dans WITHDRAW_MODE_MAP.`,
      );
      return {
        success:            false,
        paydunya_reference: "",
        status:             "failed",
        message:            `Opérateur "${params.operator}" (${params.country_code}) non supporté pour les déboursements PayDunya.`,
      };
    }

    const accountAlias = stripCountryCode(params.phone, params.country_code);
    console.log(
      `[PayDunya] Payout — mode: ${withdrawMode} | alias: ${accountAlias} | ` +
      `montant: ${params.amount} | ref: ${params.reference}`,
    );

    // ── Étape 1 — Créer la facture de déboursement ────────────────────────
    const getInvoicePayload: Record<string, unknown> = {
      account_alias:  accountAlias,
      amount:         params.amount,
      withdraw_mode:  withdrawMode,
      callback_url:   params.callback_url,
    };

    let getInvoiceRaw: any;
    try {
      getInvoiceRaw = await this.request<any>(
        "POST",
        "/disburse/get-invoice",
        getInvoicePayload,
        this.v2BaseUrl,
      );
    } catch (err: any) {
      console.error(`[PayDunya] Payout Étape 1 échouée: ${err?.message}`);
      return {
        success:            false,
        paydunya_reference: "",
        status:             "failed",
        message:            err?.message ?? "Erreur lors de la création du déboursement PayDunya",
      };
    }

    if (getInvoiceRaw.response_code !== "00" || !getInvoiceRaw.disburse_token) {
      console.error(
        `[PayDunya] Payout Étape 1 rejetée — ` +
        `code: ${getInvoiceRaw.response_code} | msg: ${getInvoiceRaw.response_text ?? getInvoiceRaw.message}`,
      );
      return {
        success:            false,
        paydunya_reference: getInvoiceRaw.disburse_token ?? "",
        status:             "failed",
        message:            getInvoiceRaw.response_text ?? getInvoiceRaw.message ?? "Échec création facture déboursement PayDunya",
      };
    }

    const disburseToken: string = getInvoiceRaw.disburse_token;
    console.log(`[PayDunya] ✓ Payout Étape 1 OK — disburse_token: ${disburseToken}`);

    // ── Étape 2 — Soumettre le déboursement ───────────────────────────────
    const submitPayload: Record<string, unknown> = {
      disburse_invoice: disburseToken,
    };
    if (params.reference) {
      submitPayload.disburse_id = params.reference;
    }

    let submitRaw: any;
    try {
      submitRaw = await this.request<any>(
        "POST",
        "/disburse/submit-invoice",
        submitPayload,
        this.v2BaseUrl,
      );
    } catch (err: any) {
      console.error(`[PayDunya] Payout Étape 2 échouée: ${err?.message}`);
      // La facture a été créée — on retourne le disburse_token pour le polling
      return {
        success:            false,
        paydunya_reference: disburseToken,
        status:             "failed",
        message:            err?.message ?? "Erreur lors de la soumission du déboursement PayDunya",
      };
    }

    if (submitRaw.response_code !== "00") {
      console.error(
        `[PayDunya] Payout Étape 2 rejetée — ` +
        `code: ${submitRaw.response_code} | msg: ${submitRaw.response_text ?? submitRaw.message}`,
      );
      return {
        success:            false,
        paydunya_reference: disburseToken,
        status:             "failed",
        message:            submitRaw.response_text ?? submitRaw.message ?? "Déboursement PayDunya refusé",
      };
    }

    const rawStatus = (submitRaw.status ?? "").toLowerCase();
    // "success" = terminé immédiatement, "pending" = asynchrone (webhook confirmera)
    // "" ou absent = traité comme pending
    const mappedStatus: PayDunyaPayoutResponse["status"] =
      rawStatus === "success" ? "completed" : "processing";

    console.log(
      `[PayDunya] ✓ Payout Étape 2 OK — statut: ${rawStatus || "non précisé"} → ${mappedStatus} | ` +
      `transaction_id: ${submitRaw.transaction_id ?? "n/a"}`,
    );

    return {
      success:            true,
      paydunya_reference: disburseToken,
      status:             mappedStatus,
      message:            submitRaw.response_text ?? submitRaw.description ?? "Déboursement PayDunya initié",
    };
  }

  // ─── Get payout (disbursement) status ─────────────────────────────────────
  async getPayoutStatus(disburseToken: string): Promise<PayDunyaStatusResponse> {
    const raw = await this.request<any>(
      "POST",
      "/disburse/check-status",
      { disburse_invoice: disburseToken },
      this.v2BaseUrl,
    );

    const rawStatus = (raw.status ?? "").toLowerCase();
    const status = this.mapStatus(rawStatus);

    return {
      paydunya_reference: disburseToken,
      our_reference:      raw.disburse_id ?? raw.transaction_id ?? "",
      status,
      amount:             parseFloat(raw.amount ?? "0"),
      currency:           raw.currency ?? "XOF",
      operator:           raw.withdraw_mode ?? "",
      phone:              "",
      failure_reason:     rawStatus === "failed" ? (raw.response_text ?? "Déboursement échoué") : undefined,
      completed_at:       raw.updated_at ?? undefined,
    };
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
    const webhookSecret = process.env.PAYDUNYA_WEBHOOK_SECRET ?? "";

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
