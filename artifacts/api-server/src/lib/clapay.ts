/**
 * ─── Clapay API Client ────────────────────────────────────────────────────────
 *
 * Variables d'environnement :
 *   CLAPAY_BASE_URL       → URL de base (ex: https://api.clapay.io/v1)
 *   CLAPAY_API_TOKEN      → Jeton API Clapay (long token hexadécimal)
 *   CLAPAY_SECRET_KEY     → Clé secrète (nowallet_sk_...) pour signer les requêtes
 *   CLAPAY_WEBHOOK_SECRET → Secret de vérification des webhooks entrants (nowallet uk...)
 */

import crypto from "crypto";

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
  description?: string;
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

  // ─── Build auth headers ───────────────────────────────────────────────────
  // Clapay utilise Bearer token + X-Secret-Key header
  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiToken}`,
      "X-Secret-Key": this.config.secretKey,
    };
  }

  // ─── HTTP helper ──────────────────────────────────────────────────────────
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

  // ─── Initiate Pay-In (Mobile Money collection) ────────────────────────────
  async initiatePayin(params: ClapayPayinRequest): Promise<ClapayPayinResponse> {
    const raw = await this.request<any>("POST", "/payments/collect", {
      amount: params.amount,
      currency: params.currency,
      country: params.country_code,
      operator: params.operator,
      phone_number: params.phone,
      external_reference: params.reference,
      order_id: params.order_id,
      callback_url: params.callback_url,
      description: params.description,
    });

    // Normalize response — Clapay peut renvoyer success ou data.success
    const success = raw?.success ?? raw?.data?.success ?? raw?.status === "success";
    const ref = raw?.reference ?? raw?.clapay_reference ?? raw?.data?.reference ?? raw?.id ?? "";

    return {
      success,
      clapay_reference: ref,
      status: raw?.status ?? (success ? "processing" : "failed"),
      payment_url: raw?.payment_url ?? raw?.data?.payment_url ?? undefined,
      ussd_code: raw?.ussd_code ?? raw?.data?.ussd_code ?? undefined,
      message: raw?.message ?? raw?.data?.message ?? undefined,
    };
  }

  // ─── Initiate Pay-Out (Mobile Money disbursement) ─────────────────────────
  async initiatePayout(params: ClapayPayoutRequest): Promise<ClapayPayoutResponse> {
    const raw = await this.request<any>("POST", "/payments/disburse", {
      amount: params.amount,
      currency: params.currency,
      country: params.country_code,
      operator: params.operator,
      phone_number: params.phone,
      external_reference: params.reference,
      callback_url: params.callback_url,
      description: params.description,
    });

    const success = raw?.success ?? raw?.data?.success ?? raw?.status === "success";
    const ref = raw?.reference ?? raw?.clapay_reference ?? raw?.data?.reference ?? raw?.id ?? "";

    return {
      success,
      clapay_reference: ref,
      status: raw?.status ?? (success ? "processing" : "failed"),
      message: raw?.message ?? raw?.data?.message ?? undefined,
    };
  }

  // ─── Check transaction status ─────────────────────────────────────────────
  async getStatus(clapayReference: string): Promise<ClapayStatusResponse> {
    return this.request<ClapayStatusResponse>("GET", `/payments/${clapayReference}`);
  }

  // ─── Verify incoming webhook signature from Clapay ────────────────────────
  // Clapay signe avec HMAC-SHA256 du payload (signature dans body.signature ou header)
  verifyWebhookSignature(payload: string, receivedSignature: string, timestamp: number): boolean {
    // Méthode 1 : HMAC-SHA256(webhookSecret, timestamp + "." + payload)
    const expected1 = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    if (expected1 === receivedSignature) return true;

    // Méthode 2 : HMAC-SHA256(webhookSecret, payload) sans timestamp
    const expected2 = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(payload)
      .digest("hex");
    if (expected2 === receivedSignature) return true;

    // Méthode 3 : comparaison base64
    try {
      const expected3 = crypto
        .createHmac("sha256", this.config.webhookSecret)
        .update(payload)
        .digest("base64");
      if (expected3 === receivedSignature) return true;
    } catch {}

    return false;
  }

  // ─── Parse webhook event from Clapay ─────────────────────────────────────
  parseWebhookEvent(body: any): ClapayWebhookPayload {
    return {
      event: body.event ?? body.type ?? body.event_type,
      clapay_reference: body.clapay_reference ?? body.reference ?? body.transaction_id ?? body.id ?? "",
      our_reference: body.external_reference ?? body.our_reference ?? body.order_id ?? "",
      status: body.status ?? "",
      amount: body.amount ?? 0,
      currency: body.currency ?? "XOF",
      operator: body.operator ?? body.payment_method ?? "unknown",
      phone: body.phone_number ?? body.phone ?? "",
      country_code: body.country ?? body.country_code ?? "",
      failure_reason: body.failure_reason ?? body.error_message ?? undefined,
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

// Reset singleton (utile si les secrets changent à chaud)
export function resetClapayClient(): void {
  _client = null;
}
