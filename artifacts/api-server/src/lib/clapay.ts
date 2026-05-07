/**
 * ─── Clapay API Client ────────────────────────────────────────────────────────
 *
 * Ce fichier est le client HTTP officiel pour l'intégration Clapay.
 * Les sections marquées TODO seront complétées dès réception des informations API.
 *
 * Variables d'environnement requises (à configurer dans Replit Secrets) :
 *   CLAPAY_BASE_URL      → URL de base de l'API Clapay  (ex: https://api.clapay.io/v1)
 *   CLAPAY_API_TOKEN     → Token d'authentification Clapay
 *   CLAPAY_WEBHOOK_SECRET → Secret pour vérifier les callbacks entrants de Clapay
 */

export interface ClapayConfig {
  baseUrl: string;
  apiToken: string;
  webhookSecret: string;
}

export interface ClapayPayinRequest {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;       // Notre référence interne DrimPay
  order_id: string;
  callback_url: string;    // URL que Clapay appelle en retour
  description?: string;
}

export interface ClapayPayinResponse {
  success: boolean;
  clapay_reference: string;   // Référence côté Clapay
  status: "pending" | "processing" | "success" | "failed";
  payment_url?: string;        // URL de paiement si applicable
  ussd_code?: string;          // Code USSD si applicable
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
  private headers(): Record<string, string> {
    // TODO: Adapter selon le schéma d'auth Clapay fourni
    // Exemples possibles selon ce que Clapay utilise :
    //   Bearer token  → { Authorization: `Bearer ${this.config.apiToken}` }
    //   API-Key header → { "X-Api-Key": this.config.apiToken }
    //   Basic auth    → { Authorization: `Basic ${Buffer.from(apiToken+":").toString("base64")}` }
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiToken}`,
      // TODO: Ajouter tout header supplémentaire requis par Clapay
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
    // TODO: Adapter le nom de l'endpoint et le format du body selon la doc Clapay
    // Exemple probable : POST /payments/collect  ou  POST /payin/initiate
    return this.request<ClapayPayinResponse>("POST", "/payments/collect", {
      // TODO: Mapper nos paramètres vers les noms de champs exacts de Clapay
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
  }

  // ─── Initiate Pay-Out (Mobile Money disbursement) ─────────────────────────
  async initiatePayout(params: ClapayPayoutRequest): Promise<ClapayPayoutResponse> {
    // TODO: Adapter le nom de l'endpoint et le format du body selon la doc Clapay
    return this.request<ClapayPayoutResponse>("POST", "/payments/disburse", {
      amount: params.amount,
      currency: params.currency,
      country: params.country_code,
      operator: params.operator,
      phone_number: params.phone,
      external_reference: params.reference,
      callback_url: params.callback_url,
      description: params.description,
    });
  }

  // ─── Check transaction status ─────────────────────────────────────────────
  async getStatus(clapayReference: string): Promise<ClapayStatusResponse> {
    // TODO: Adapter l'endpoint selon la doc Clapay
    // Exemple : GET /payments/{clapay_reference}  ou  GET /transactions/{ref}/status
    return this.request<ClapayStatusResponse>("GET", `/payments/${clapayReference}`);
  }

  // ─── Verify incoming webhook signature from Clapay ────────────────────────
  verifyWebhookSignature(payload: string, receivedSignature: string, timestamp: number): boolean {
    // TODO: Adapter selon la méthode de signature exacte de Clapay (HMAC-SHA256, etc.)
    // Exemple avec HMAC-SHA256 :
    const { createHmac } = require("crypto");
    const expectedSig = createHmac("sha256", this.config.webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    return expectedSig === receivedSignature;
  }

  // ─── Parse webhook event from Clapay ─────────────────────────────────────
  parseWebhookEvent(body: any): ClapayWebhookPayload {
    // TODO: Adapter le mapping selon la structure exacte du webhook Clapay
    return {
      event: body.event ?? body.type,
      clapay_reference: body.clapay_reference ?? body.transaction_id ?? body.reference,
      our_reference: body.external_reference ?? body.our_reference ?? body.order_id,
      status: body.status,
      amount: body.amount,
      currency: body.currency,
      operator: body.operator,
      phone: body.phone_number ?? body.phone,
      country_code: body.country ?? body.country_code,
      failure_reason: body.failure_reason ?? body.error_message,
      completed_at: body.completed_at ?? body.updated_at,
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
    const webhookSecret = process.env.CLAPAY_WEBHOOK_SECRET ?? "placeholder-secret";

    if (!baseUrl || !apiToken) {
      throw new Error(
        "Clapay non configuré. Définissez CLAPAY_BASE_URL et CLAPAY_API_TOKEN dans les secrets."
      );
    }

    _client = new ClapayClient({ baseUrl, apiToken, webhookSecret });
  }
  return _client;
}

export function isClapayConfigured(): boolean {
  return !!(process.env.CLAPAY_BASE_URL && process.env.CLAPAY_API_TOKEN);
}
