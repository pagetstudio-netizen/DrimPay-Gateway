/**
 * ─── Clapay / Nowallet V3 API Client ─────────────────────────────────────────
 *
 * Variables d'environnement :
 *   CLAPAY_BASE_URL       → https://nw-api.clapay.app/nowallet/api
 *   CLAPAY_API_TOKEN      → Bearer token (Authorization header)
 *   CLAPAY_SECRET_KEY     → non utilisé par Nowallet V3 (conservé pour compat)
 *   CLAPAY_WEBHOOK_SECRET → secret de vérification des webhooks entrants
 *
 * Endpoints Nowallet V3 :
 *   POST /init/payment          → initier un pay-in (collect)
 *   POST /check/status/payment  → vérifier le statut (body: { signature })
 *
 * Format body /init/payment :
 *   transaction_id      string  UUID interne (référence unique)
 *   amount              number
 *   callback_url        string
 *   return_url          string  (optionnel)
 *   country_code        string  ex: "SN", "CM"
 *   operators_code      string[] ex: ["OM"], ["MTN"]
 *   method              "MERCHANT"
 *   tunnel              "API"   (push to phone) | "CHECKOUTPAGE" (hosted page)
 *   operator_otp        string  (requis pour OM et TELECEL uniquement)
 *   additional_infos    { customer_phone, customer_email, customer_firstname, customer_lastname }
 *
 * Codes opérateurs Nowallet :
 *   OM, MTN, MOOV, WAVE, TELECEL, AIRTEL, AIRTELTIGO, VODAFONE,
 *   TIGO, HALOTEL, SAFARICOM, MPS, FREEMONEY, EMONEY, WIZALL, TMONEY,
 *   ZAMANI, MYNITA, AMANATA
 */

import crypto from "crypto";

// ─── Opérateurs qui nécessitent un OTP ────────────────────────────────────────
const OTP_REQUIRED_OPERATORS = new Set(["OM", "TELECEL"]);

// ─── Mapping noms lisibles → codes Nowallet ───────────────────────────────────
const OPERATOR_CODE_MAP: Record<string, string> = {
  // Orange Money
  "orange money": "OM",
  "orange": "OM",
  "om": "OM",
  // MTN
  "mtn mobile money": "MTN",
  "mtn momo": "MTN",
  "mtn ghana": "MTN",
  "mtn nigeria": "MTN",
  "mtn": "MTN",
  // Moov
  "moov money": "MOOV",
  "moov": "MOOV",
  // Wave
  "wave": "WAVE",
  // Telecel (ex-Tigo)
  "telecel": "TELECEL",
  // Airtel
  "airtel nigeria": "AIRTEL",
  "airtel": "AIRTEL",
  // Airtel Tigo
  "airteltigo": "AIRTELTIGO",
  "airtel tigo": "AIRTELTIGO",
  // Vodafone
  "vodafone cash": "VODAFONE",
  "vodafone ghana": "VODAFONE",
  "vodafone": "VODAFONE",
  // Tigo
  "tigo pesa": "TIGO",
  "tigo": "TIGO",
  // Halo Pesa
  "halo pesa": "HALOTEL",
  "halotel": "HALOTEL",
  // Safaricom
  "safaricom": "SAFARICOM",
  // Mpesa
  "mpesa": "MPS",
  "m-pesa": "MPS",
  // Free Money
  "free money": "FREEMONEY",
  "freemoney": "FREEMONEY",
  // E-Money
  "emoney": "EMONEY",
  "e-money": "EMONEY",
  // T-Money
  "tmoney": "TMONEY",
  "t-money": "TMONEY",
  // MyNita
  "mynita": "MYNITA",
  // Zamani
  "zamani": "ZAMANI",
  // Wizall
  "wizall": "WIZALL",
  // Amanata
  "amanata": "AMANATA",
};

export function toNowWalletOperatorCode(operator: string): string {
  const key = operator.toLowerCase().trim();
  return OPERATOR_CODE_MAP[key] ?? operator.toUpperCase();
}

export interface ClapayConfig {
  baseUrl: string;
  apiToken: string;
  secretKey: string;
  webhookSecret: string;
}

export interface ClapayPayinRequest {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  order_id: string;
  callback_url: string;
  return_url?: string;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  operator_otp?: string;
}

export interface ClapayPayinResponse {
  success: boolean;
  clapay_reference: string;
  status: "pending" | "processing" | "success" | "failed";
  payment_url?: string;
  ussd_code?: string;
  message?: string;
}

export interface ClapayPayoutRequest {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  description?: string;
  callback_url: string;
}

export interface ClapayPayoutResponse {
  success: boolean;
  clapay_reference: string;
  status: "pending" | "processing" | "success" | "failed";
  message?: string;
}

export interface ClapayStatusResponse {
  clapay_reference: string;
  our_reference: string;
  status: "pending" | "processing" | "success" | "failed" | "expired" | "cancelled";
  amount: number;
  currency: string;
  operator: string;
  phone: string;
  failure_reason?: string;
  completed_at?: string;
}

export interface ClapayWebhookPayload {
  event: "payin.success" | "payin.failed" | "payin.expired" | "payout.success" | "payout.failed";
  clapay_reference: string;
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
  signature: string;
}

export class ClapayClient {
  private config: ClapayConfig;

  constructor(config: ClapayConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${this.config.apiToken}`,
    };
  }

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

    const data = await response.json() as any;

    if (!response.ok) {
      throw new ClapayError(
        data?.message ?? data?.error ?? `Clapay API error ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  }

  // ─── Initiate Pay-In — Nowallet V3 POST /init/payment ─────────────────────
  async initiatePayin(params: ClapayPayinRequest): Promise<ClapayPayinResponse> {
    const operatorCode = toNowWalletOperatorCode(params.operator);
    const needsOtp = OTP_REQUIRED_OPERATORS.has(operatorCode);

    const requestBody: Record<string, any> = {
      transaction_id: params.reference,
      amount: params.amount,
      callback_url: params.callback_url,
      country_code: params.country_code,
      operators_code: [operatorCode],
      method: "MERCHANT",
      tunnel: "API",
      additional_infos: {
        customer_phone: params.phone,
        ...(params.customer_email ? { customer_email: params.customer_email } : {}),
        ...(params.customer_name ? { customer_firstname: params.customer_name } : {}),
      },
    };

    if (params.return_url) {
      requestBody.return_url = params.return_url;
    }

    // operator_otp requis pour OM et TELECEL — si non fourni, on laisse vide
    // (le marchand devra le transmettre dans un second temps via confirm)
    if (needsOtp && params.operator_otp) {
      requestBody.operator_otp = params.operator_otp;
    }

    const raw = await this.request<any>("POST", "/init/payment", requestBody);

    // Réponse Nowallet V3 :
    // { country, currency, signature, available_operator, authorized_operator,
    //   payment_url_operator?, payment_url?, status_payment, message, observation_error, payment_otp? }
    const statusPayment: string = raw?.status_payment ?? "";
    const signature: string = raw?.signature ?? "";

    const isOk = statusPayment === "INITIATED" ||
      statusPayment === "PENDING" ||
      statusPayment === "PROCESSING" ||
      statusPayment === "SUCCESS" ||
      !!signature;

    return {
      success: isOk,
      clapay_reference: signature,
      status: isOk ? "processing" : "failed",
      payment_url: raw?.payment_url_operator ?? raw?.payment_url ?? undefined,
      ussd_code: raw?.payment_otp ?? undefined,
      message: raw?.message ?? statusPayment ?? undefined,
    };
  }

  // ─── Initiate Pay-Out — à adapter selon endpoint Nowallet payout ──────────
  async initiatePayout(params: ClapayPayoutRequest): Promise<ClapayPayoutResponse> {
    const operatorCode = toNowWalletOperatorCode(params.operator);

    const raw = await this.request<any>("POST", "/init/payout", {
      transaction_id: params.reference,
      amount: params.amount,
      callback_url: params.callback_url,
      country_code: params.country_code,
      operators_code: [operatorCode],
      method: "MERCHANT",
      additional_infos: {
        customer_phone: params.phone,
      },
    });

    const statusPayment: string = raw?.status_payment ?? "";
    const signature: string = raw?.signature ?? "";
    const isOk = !!signature || statusPayment === "INITIATED" || statusPayment === "PENDING";

    return {
      success: isOk,
      clapay_reference: signature,
      status: isOk ? "processing" : "failed",
      message: raw?.message ?? statusPayment ?? undefined,
    };
  }

  // ─── Check transaction status — POST /check/status/payment ────────────────
  async getStatus(clapaySignature: string): Promise<ClapayStatusResponse> {
    const raw = await this.request<any>("POST", "/check/status/payment", {
      signature: clapaySignature,
    });

    return {
      clapay_reference: raw?.signature ?? clapaySignature,
      our_reference: raw?.transaction_id ?? "",
      status: this._mapStatus(raw?.status_payment ?? raw?.status ?? ""),
      amount: raw?.amount ?? 0,
      currency: raw?.currency ?? "XOF",
      operator: raw?.operator ?? "",
      phone: raw?.customer_phone ?? raw?.phone ?? "",
      failure_reason: raw?.observation_error ?? raw?.message ?? undefined,
      completed_at: raw?.completed_at ?? raw?.updated_at ?? undefined,
    };
  }

  private _mapStatus(s: string): ClapayStatusResponse["status"] {
    const u = s.toUpperCase();
    if (u === "SUCCESS" || u === "SUCCESSFUL" || u === "COMPLETED") return "success";
    if (u === "FAILED" || u === "ERROR" || u === "REJECTED") return "failed";
    if (u === "EXPIRED") return "expired";
    if (u === "CANCELLED" || u === "CANCELED") return "cancelled";
    if (u === "INITIATED" || u === "PENDING") return "pending";
    if (u === "PROCESSING") return "processing";
    return "pending";
  }

  // ─── Verify incoming webhook signature ────────────────────────────────────
  verifyWebhookSignature(payload: string, receivedSignature: string, timestamp: number): boolean {
    const expected1 = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    if (expected1 === receivedSignature) return true;

    const expected2 = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(payload)
      .digest("hex");
    if (expected2 === receivedSignature) return true;

    try {
      const expected3 = crypto
        .createHmac("sha256", this.config.webhookSecret)
        .update(payload)
        .digest("base64");
      if (expected3 === receivedSignature) return true;
    } catch {}

    return false;
  }

  // ─── Parse webhook event ──────────────────────────────────────────────────
  parseWebhookEvent(body: any): ClapayWebhookPayload {
    return {
      event: body.event ?? body.type ?? body.event_type,
      clapay_reference: body.signature ?? body.clapay_reference ?? body.reference ?? body.transaction_id ?? body.id ?? "",
      our_reference: body.transaction_id ?? body.external_reference ?? body.our_reference ?? body.order_id ?? "",
      status: body.status_payment ?? body.status ?? "",
      amount: body.amount ?? 0,
      currency: body.currency ?? "XOF",
      operator: body.operator ?? body.operators_code?.[0] ?? body.payment_method ?? "unknown",
      phone: body.additional_infos?.customer_phone ?? body.phone_number ?? body.phone ?? "",
      country_code: body.country_code ?? body.country ?? "",
      failure_reason: body.observation_error ?? body.failure_reason ?? body.error_message ?? undefined,
      completed_at: body.completed_at ?? body.updated_at ?? undefined,
      timestamp: body.timestamp ?? Math.floor(Date.now() / 1000),
      signature: body.signature ?? "",
    };
  }
}

export class ClapayError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly raw: any
  ) {
    super(message);
    this.name = "ClapayError";
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────
let _client: ClapayClient | null = null;

export function getClapayClient(): ClapayClient {
  if (!_client) {
    const baseUrl = process.env.CLAPAY_BASE_URL;
    const apiToken = process.env.CLAPAY_API_TOKEN;
    const secretKey = process.env.CLAPAY_SECRET_KEY ?? "";
    const webhookSecret = process.env.CLAPAY_WEBHOOK_SECRET ?? "";

    if (!baseUrl || !apiToken) {
      throw new Error(
        "Clapay non configuré. Définissez CLAPAY_BASE_URL et CLAPAY_API_TOKEN dans les secrets."
      );
    }

    _client = new ClapayClient({ baseUrl, apiToken, secretKey, webhookSecret });
  }
  return _client;
}

export function isClapayConfigured(): boolean {
  return !!(process.env.CLAPAY_BASE_URL && process.env.CLAPAY_API_TOKEN);
}

export function resetClapayClient(): void {
  _client = null;
}

export function logClapayConfig(): void {
  const baseUrl = process.env.CLAPAY_BASE_URL ?? "(non défini)";
  const hasToken = !!(process.env.CLAPAY_API_TOKEN);
  console.log(`[Clapay] Base URL: ${baseUrl} | Token: ${hasToken ? "✓" : "✗"}`);
}
