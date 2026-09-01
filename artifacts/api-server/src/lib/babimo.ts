/**
 * Babimo / B-Pay API client.
 *
 * Babimo's Côte d'Ivoire API uses:
 *   POST /oauth/login
 *   POST /paiement
 *   POST /collect/cashin
 *   GET  /check-status/{status_token}
 *
 * The API credentials are kept in Replit Secrets:
 *   BABIMO_EMAIL
 *   BABIMO_PASSWORD
 * Optional:
 *   BABIMO_BASE_URL (defaults to the documented v2.b-pay.co API)
 */

const DEFAULT_BASE_URL = "https://v2.b-pay.co/service/api/v1";

const PAYMENT_METHODS: Record<string, string> = {
  "mtn|CI": "MTN_CI",
  "mtn momo|CI": "MTN_CI",
  "mtn mobile money|CI": "MTN_CI",
  "orange|CI": "OM_CI",
  "orange money|CI": "OM_CI",
  "om|CI": "OM_CI",
  "wave|CI": "WAVE_CI",
  "moov|CI": "MOOV_CI",
  "moov money|CI": "MOOV_CI",
};

const FINAL_STATUSES = new Set(["success", "completed", "paid", "failed", "cancelled", "canceled", "expired"]);

function normalizeCoteDIvoirePhone(phone: string): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("225")) {
    const local = digits.slice(3);
    return local.startsWith("0") ? local : `0${local}`;
  }
  return digits.startsWith("0") ? digits : `0${digits}`;
}

function unwrap(raw: any): any {
  return raw?.data ?? raw?.result ?? raw;
}

function firstString(raw: any, keys: string[]): string {
  const candidates = [raw, raw?.data, raw?.result, raw?.data?.data, raw?.result?.data];
  for (const object of candidates) {
    if (!object || typeof object !== "object") continue;
    for (const key of keys) {
      const value = object[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
}

function responseStatus(raw: any): string {
  const value = firstString(raw, ["status", "transaction_status", "payment_status", "state"]);
  return value.toLowerCase();
}

function mapStatus(raw: string): "pending" | "processing" | "success" | "failed" | "expired" | "cancelled" {
  const status = (raw ?? "").toLowerCase();
  if (status === "success" || status === "completed" || status === "paid") return "success";
  if (status === "failed" || status === "error" || status === "rejected" || status === "declined") return "failed";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "expired") return "expired";
  if (status === "processing" || status === "initiated" || status === "pending") return "processing";
  return "pending";
}

function errorMessage(raw: any, fallback: string): string {
  return firstString(raw, ["message", "error", "response_text", "description"]) || fallback;
}

function isRejected(raw: any): boolean {
  const status = raw?.status ?? raw?.data?.status ?? raw?.result?.status;
  return status === false || raw?.success === false || raw?.data?.success === false;
}

export interface BabimoConfig {
  baseUrl: string;
  email: string;
  password: string;
}

export interface BabimoPayinRequest {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  callback_url: string;
  return_url?: string;
  operator_otp?: string;
  description?: string;
}

export interface BabimoPayoutRequest {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  callback_url: string;
}

export interface BabimoPaymentResponse {
  success: boolean;
  babimo_reference: string;
  status: "pending" | "processing" | "success" | "failed" | "expired" | "cancelled";
  payment_url?: string | null;
  message?: string;
}

export interface BabimoStatusResponse {
  babimo_reference: string;
  status: "pending" | "processing" | "success" | "failed" | "expired" | "cancelled";
  amount: number;
  currency: string;
  failure_reason?: string;
}

export class BabimoError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly raw: any,
  ) {
    super(message);
    this.name = "BabimoError";
  }
}

export function babimoPaymentMethod(operator: string, countryCode: string): string | null {
  return PAYMENT_METHODS[`${operator.toLowerCase().trim()}|${countryCode.toUpperCase().trim()}`] ?? null;
}

export class BabimoClient {
  private readonly config: BabimoConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: BabimoConfig) {
    this.config = { ...config, baseUrl: config.baseUrl.replace(/\/+$/, "") };
  }

  private async login(): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/oauth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: this.config.email, password: this.config.password }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err: any) {
      throw new BabimoError(`Erreur réseau Babimo lors de l'authentification : ${err?.message ?? err}`, 503, {
        retryable: true,
      });
    }

    const raw = await this.readResponse(response);
    if (!response.ok) {
      throw new BabimoError(errorMessage(raw, `Babimo login HTTP ${response.status}`), response.status, raw);
    }

    const token = firstString(raw, ["token", "access_token", "accessToken"]);
    if (!token) {
      throw new BabimoError("Babimo n'a pas retourné de token d'accès.", 502, raw);
    }

    this.accessToken = token;
    this.tokenExpiresAt = Date.now() + 20 * 60 * 1000;
    return token;
  }

  private async readResponse(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new BabimoError(
        `Réponse Babimo invalide (HTTP ${response.status})`,
        response.status,
        { bodyPreview: text.slice(0, 500), retryable: false },
      );
    }
  }

  private async request<T>(method: "GET" | "POST", path: string, body?: object, retry = true): Promise<T> {
    const token = this.accessToken && Date.now() < this.tokenExpiresAt
      ? this.accessToken
      : await this.login();

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err: any) {
      throw new BabimoError(`Erreur réseau Babimo : ${err?.message ?? err}`, 503, { retryable: true });
    }

    let raw: any;
    try {
      raw = await this.readResponse(response);
    } catch (err) {
      if (err instanceof BabimoError) throw err;
      throw err;
    }

    if (response.status === 401 && retry) {
      this.accessToken = null;
      this.tokenExpiresAt = 0;
      return this.request<T>(method, path, body, false);
    }

    if (!response.ok || isRejected(raw)) {
      throw new BabimoError(errorMessage(raw, `Babimo API HTTP ${response.status}`), response.status, raw);
    }
    return raw as T;
  }

  async initiatePayin(params: BabimoPayinRequest): Promise<BabimoPaymentResponse> {
    const paymentMethod = babimoPaymentMethod(params.operator, params.country_code);
    if (!paymentMethod) {
      return {
        success: false,
        babimo_reference: "",
        status: "failed",
        message: `Opérateur "${params.operator}" (${params.country_code}) non supporté par Babimo.`,
      };
    }

    const payload: Record<string, unknown> = {
      currency: params.currency || "XOF",
      payment_method: paymentMethod,
      merchant_transaction_id: params.reference,
      amount: params.amount,
      telephone: normalizeCoteDIvoirePhone(params.phone),
      success_url: params.return_url ?? params.callback_url,
      failed_url: params.return_url ?? params.callback_url,
      notify_url: params.callback_url,
      refercence_cl: params.reference,
    };
    if (paymentMethod === "OM_CI" && params.operator_otp) {
      payload.otp_code = params.operator_otp;
    }

    const raw = await this.request<any>("POST", "/paiement", payload);
    const data = unwrap(raw);
    const reference = firstString(raw, ["status_token", "statusToken", "transaction_id", "transactionId", "token"]);
    if (!reference) {
      throw new BabimoError("Babimo n'a pas retourné de référence de transaction.", 502, raw);
    }

    return {
      success: true,
      babimo_reference: reference,
      status: mapStatus(responseStatus(raw)),
      payment_url: firstString(raw, ["payment_url", "paymentUrl", "url", "checkout_url"]) || (typeof data === "string" ? data : null),
      message: errorMessage(raw, "Paiement Babimo initié."),
    };
  }

  async initiatePayout(params: BabimoPayoutRequest): Promise<BabimoPaymentResponse> {
    const paymentMethod = babimoPaymentMethod(params.operator, params.country_code);
    if (!paymentMethod) {
      return {
        success: false,
        babimo_reference: "",
        status: "failed",
        message: `Opérateur "${params.operator}" (${params.country_code}) non supporté par Babimo pour les payouts.`,
      };
    }

    const raw = await this.request<any>("POST", "/collect/cashin", {
      payment_method: paymentMethod,
      merchant_transaction_id: params.reference,
      amount: params.amount,
      telephone: normalizeCoteDIvoirePhone(params.phone),
      notify_url: params.callback_url,
      refercence_cl: params.reference,
    });
    const reference = firstString(raw, ["status_token", "statusToken", "transaction_id", "transactionId", "token"]);
    if (!reference) {
      throw new BabimoError("Babimo n'a pas retourné de référence de payout.", 502, raw);
    }

    return {
      success: true,
      babimo_reference: reference,
      status: mapStatus(responseStatus(raw)),
      message: errorMessage(raw, "Payout Babimo initié."),
    };
  }

  async getStatus(reference: string): Promise<BabimoStatusResponse> {
    const raw = await this.request<any>("GET", `/check-status/${encodeURIComponent(reference)}`);
    const status = mapStatus(responseStatus(raw));
    const data = unwrap(raw);
    return {
      babimo_reference: reference,
      status,
      amount: Number(data?.amount ?? raw?.amount ?? 0),
      currency: String(data?.currency ?? raw?.currency ?? "XOF"),
      failure_reason: status === "failed" ? errorMessage(raw, "Transaction Babimo échouée.") : undefined,
    };
  }

  static isFinalStatus(status: string): boolean {
    return FINAL_STATUSES.has((status ?? "").toLowerCase());
  }
}

let client: BabimoClient | null = null;

export function isBabimoConfigured(): boolean {
  return Boolean(process.env.BABIMO_EMAIL && process.env.BABIMO_PASSWORD);
}

export function getBabimoClient(): BabimoClient {
  if (!client) {
    const email = process.env.BABIMO_EMAIL;
    const password = process.env.BABIMO_PASSWORD;
    if (!email || !password) {
      throw new Error("Babimo non configuré. Définissez BABIMO_EMAIL et BABIMO_PASSWORD dans les Secrets Replit.");
    }
    client = new BabimoClient({
      baseUrl: process.env.BABIMO_BASE_URL ?? DEFAULT_BASE_URL,
      email,
      password,
    });
  }
  return client;
}