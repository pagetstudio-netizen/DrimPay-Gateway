/**
 * ─── PayDunya API Client ──────────────────────────────────────────────────────
 *
 * Variables d'environnement requises (à configurer dans Replit Secrets) :
 *   PAYDUNYA_BASE_URL        → URL de base (ex: https://app.paydunya.com/api/v1)
 *   PAYDUNYA_MASTER_KEY      → Master Key PayDunya
 *   PAYDUNYA_PRIVATE_KEY     → Private Key PayDunya
 *   PAYDUNYA_TOKEN           → Token PayDunya
 *   PAYDUNYA_WEBHOOK_SECRET  → Secret pour vérifier les callbacks entrants
 *
 * TODO: Adapter les endpoints et noms de champs selon la documentation PayDunya reçue.
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
    // TODO: Adapter selon le schéma d'auth exact de PayDunya.
    // PayDunya utilise généralement ces headers :
    return {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY":   this.config.masterKey,
      "PAYDUNYA-PRIVATE-KEY":  this.config.privateKey,
      "PAYDUNYA-TOKEN":        this.config.token,
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
      throw new PayDunyaError(
        data?.message ?? data?.response_text ?? `PayDunya API error ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  }

  // ─── Initiate Pay-In ──────────────────────────────────────────────────────
  async initiatePayin(params: PayDunyaPayinRequest): Promise<PayDunyaPayinResponse> {
    // TODO: Adapter l'endpoint et le corps selon la doc PayDunya.
    // Endpoints PayDunya possibles :
    //   POST /softorder/create  (checkout standard)
    //   POST /direct-pay/credit-account  (paiement direct Mobile Money)
    return this.request<PayDunyaPayinResponse>("POST", "/softorder/create", {
      // TODO: Mapper selon les champs exacts de l'API PayDunya
      invoice: {
        total_amount: params.amount,
        description: params.description ?? `Paiement DrimPay ${params.reference}`,
      },
      store: {
        name: "DrimPay",
        website_url: "https://drimpay.com",
      },
      actions: {
        cancel_url: params.cancel_url ?? "https://drimpay.com/cancel",
        return_url: params.return_url ?? "https://drimpay.com/success",
        callback_url: params.callback_url,
      },
      custom_data: {
        drimpay_reference: params.reference,
        order_id: params.order_id,
      },
      payment_method: {
        operator: params.operator,
        phone: params.phone,
        country: params.country_code,
        currency: params.currency,
      },
    });
  }

  // ─── Initiate Pay-Out ─────────────────────────────────────────────────────
  async initiatePayout(params: PayDunyaPayoutRequest): Promise<PayDunyaPayoutResponse> {
    // TODO: Adapter l'endpoint et le corps selon la doc PayDunya.
    return this.request<PayDunyaPayoutResponse>("POST", "/direct-pay/debit-account", {
      account_alias: params.phone,
      amount: params.amount,
      description: params.description ?? `Paiement sortant DrimPay ${params.reference}`,
      external_reference: params.reference,
      callback_url: params.callback_url,
      operator: params.operator,
      country: params.country_code,
      currency: params.currency,
    });
  }

  // ─── Get transaction status ───────────────────────────────────────────────
  async getStatus(paydunyaReference: string): Promise<PayDunyaStatusResponse> {
    // TODO: Adapter l'endpoint selon la doc PayDunya.
    // Exemples : GET /softorder/details/{token}  ou  GET /transactions/{ref}
    return this.request<PayDunyaStatusResponse>("GET", `/softorder/details/${paydunyaReference}`);
  }

  // ─── Verify webhook signature from PayDunya ───────────────────────────────
  verifyWebhookSignature(payload: string, receivedHash: string): boolean {
    // TODO: Adapter selon la méthode de signature de PayDunya.
    // PayDunya utilise généralement un hash SHA512 de la clé maître + le payload.
    const expected = crypto
      .createHash("sha512")
      .update(this.config.masterKey + payload)
      .digest("hex");
    return expected === receivedHash;
  }

  // ─── Parse webhook event from PayDunya ───────────────────────────────────
  parseWebhookEvent(body: any): PayDunyaWebhookPayload {
    // TODO: Adapter selon la structure exacte du webhook PayDunya.
    // PayDunya envoie généralement les données dans une structure spécifique.
    const invoice = body.invoice ?? body;
    const customData = body.custom_data ?? {};

    return {
      event:               body.event_type ?? (invoice.status === "completed" ? "payin.success" : "payin.failed"),
      paydunya_reference:  invoice.token ?? body.paydunya_reference ?? body.reference,
      our_reference:       customData.drimpay_reference ?? body.external_reference ?? body.our_reference,
      status:              invoice.status ?? body.status,
      amount:              parseFloat(invoice.total_amount ?? body.amount ?? "0"),
      currency:            invoice.currency ?? body.currency ?? "XOF",
      operator:            body.payment_method?.operator ?? body.operator ?? "unknown",
      phone:               body.payment_method?.phone ?? body.phone ?? "",
      country_code:        body.payment_method?.country ?? body.country_code ?? "",
      failure_reason:      body.failure_reason ?? invoice.fail_reason,
      completed_at:        invoice.completed_at ?? body.completed_at,
      timestamp:           body.timestamp ?? Math.floor(Date.now() / 1000),
      hash:                body.hash,
    };
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

export function getPayDunyaClient(): PayDunyaClient {
  if (!_client) {
    const baseUrl      = process.env.PAYDUNYA_BASE_URL;
    const masterKey    = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey   = process.env.PAYDUNYA_PRIVATE_KEY;
    const token        = process.env.PAYDUNYA_TOKEN;
    const webhookSecret = process.env.PAYDUNYA_WEBHOOK_SECRET ?? "placeholder-secret";

    if (!baseUrl || !masterKey || !privateKey || !token) {
      throw new Error(
        "PayDunya non configuré. Définissez PAYDUNYA_BASE_URL, PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY et PAYDUNYA_TOKEN dans les secrets."
      );
    }

    _client = new PayDunyaClient({ baseUrl, masterKey, privateKey, token, webhookSecret });
  }
  return _client;
}

export function isPayDunyaConfigured(): boolean {
  return !!(
    process.env.PAYDUNYA_BASE_URL &&
    process.env.PAYDUNYA_MASTER_KEY &&
    process.env.PAYDUNYA_PRIVATE_KEY &&
    process.env.PAYDUNYA_TOKEN
  );
}
