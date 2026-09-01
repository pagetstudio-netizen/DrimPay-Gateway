/**
 * Gombo Plus API client.
 *
 * The public API documented at https://api.gomboplus.com/api/docs/ uses
 * X-Public-Key and X-Private-Key authentication and returns HTTP 202 for
 * accepted mobile-money operations.
 *
 * Supported provider routes:
 *   POST /api/mobile-services/mobile-deposit/
 *   POST /api/mobile-services/mobile-withdrawal/
 *   POST /api/mobile-services/check-transaction-status/
 *   GET  /api/wallets/get-balance/
 *
 * Credentials are read from Replit Secrets:
 *   GOMBOPLUS_BASE_URL
 *   GOMBOPLUS_PUBLIC_KEY
 *   GOMBOPLUS_PRIVATE_KEY
 *   GOMBOPLUS_WEBHOOK_SECRET (optional; reserved for provider rollout)
 */

const DEFAULT_BASE_URL = "https://api.gomboplus.com";

type GomboOperation = "payin" | "payout";

const OPERATOR_CODES: Record<string, string> = {
  "yas|TG": "yas",
  "tmoney|TG": "yas",
  "togo telecom|TG": "yas",
  "moov|TG": "moov",
  "moov money|TG": "moov",
  "mtn|BJ": "mtn",
  "mtn mobile money|BJ": "mtn",
  "mtn momo|BJ": "mtn",
  "moov|BJ": "moov",
  "moov money|BJ": "moov",
  // Gombo's documentation lists Orange Burkina as temporarily under
  // maintenance. Keep the code known, but refuse it explicitly below so it
  // cannot be mistaken for an active route.
  "orange|BF": "om",
  "orange money|BF": "om",
  "om|BF": "om",
  "moov|BF": "moov",
  "moov money|BF": "moov",
};

const GOMBO_COUNTRIES = new Set(["TG", "BJ", "BF"]);
const MAINTENANCE_OPERATOR = "om|BF";

function countryKey(countryCode: string): string {
  return String(countryCode ?? "").trim().toUpperCase();
}

function operatorKey(operator: string, countryCode: string): string {
  return `${String(operator ?? "").trim().toLowerCase()}|${countryKey(countryCode)}`;
}

/**
 * Gombo expects a local number without the international dialing prefix.
 * Its examples are 8- or 10-digit local numbers without a leading zero.
 */
function normalizeRecipientNumber(phone: string, countryCode: string): string {
  const country = countryKey(countryCode);
  const dialingCodes: Record<string, string> = { TG: "228", BJ: "229", BF: "226" };
  let digits = String(phone ?? "").replace(/\D/g, "");
  const dialingCode = dialingCodes[country];
  if (dialingCode && digits.startsWith(dialingCode)) digits = digits.slice(dialingCode.length);
  return digits.replace(/^0+/, "");
}

function unwrap(raw: any): any {
  return raw?.content ?? raw?.data ?? raw?.result ?? raw;
}

function firstValue(raw: any, keys: string[]): unknown {
  const candidates = [raw, raw?.content, raw?.data, raw?.result, raw?.content?.data, raw?.data?.data];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    for (const key of keys) {
      const value = candidate[key];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number") return value;
    }
  }
  return undefined;
}

function stringValue(raw: any, keys: string[]): string {
  const value = firstValue(raw, keys);
  return value === undefined ? "" : String(value);
}

function mapStatus(value: unknown): "pending" | "processing" | "success" | "failed" | "expired" | "cancelled" {
  const status = String(value ?? "").toLowerCase().trim();
  if (status.includes("success") || status.includes("completed") || status.includes("paid") || status === "succes") return "success";
  if (status.includes("fail") || status.includes("error") || status.includes("reject") || status.includes("declin")) return "failed";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("expir")) return "expired";
  if (status.includes("process") || status.includes("initi") || status.includes("pending") || status.includes("progress")) return "processing";
  return "pending";
}

function responseMessage(raw: any, fallback: string): string {
  return stringValue(raw, ["message", "status_message", "error", "detail", "description"]) || fallback;
}

export interface GomboPlusPayinRequest {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  callback_url: string;
  return_url?: string;
  description?: string;
}

export type GomboPlusPayoutRequest = Omit<GomboPlusPayinRequest, "return_url">;

export interface GomboPlusPaymentResponse {
  success: boolean;
  gomboplus_reference: string;
  status: "pending" | "processing" | "success" | "failed" | "expired" | "cancelled";
  payment_url?: string | null;
  message?: string;
}

export interface GomboPlusStatusResponse {
  gomboplus_reference: string;
  status: "pending" | "processing" | "success" | "failed" | "expired" | "cancelled";
  amount: number;
  currency: string;
  failure_reason?: string;
}

export interface GomboPlusBalanceResponse {
  balance: number;
  currency: string;
  country_code: string;
  operator_code: string;
  is_active: boolean;
}

export class GomboPlusError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly raw: any,
  ) {
    super(message);
    this.name = "GomboPlusError";
  }
}

export function gomboPlusOperatorCode(operator: string, countryCode: string): string | null {
  return OPERATOR_CODES[operatorKey(operator, countryCode)] ?? null;
}

export function isGomboPlusSupported(operator: string, countryCode: string, operation: GomboOperation): boolean {
  const country = countryKey(countryCode);
  const code = gomboPlusOperatorCode(operator, country);
  if (!GOMBO_COUNTRIES.has(country) || !code) return false;
  if (operation === "payout" && operatorKey(operator, country) === MAINTENANCE_OPERATOR) return false;
  return true;
}

function isRejected(raw: any): boolean {
  return raw?.status === "failed" || raw?.status === false || raw?.success === false;
}

export class GomboPlusClient {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor(config: { baseUrl: string; publicKey: string; privateKey: string }) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.publicKey = config.publicKey;
    this.privateKey = config.privateKey;
  }

  private async readResponse(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new GomboPlusError(
        `Réponse Gombo Plus invalide (HTTP ${response.status})`,
        response.status,
        { bodyPreview: text.slice(0, 500) },
      );
    }
  }

  private async request<T>(method: "GET" | "POST", path: string, body?: object, query?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (query) url += `?${new URLSearchParams(query).toString()}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          "X-Public-Key": this.publicKey,
          "X-Private-Key": this.privateKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err: any) {
      throw new GomboPlusError(`Erreur réseau Gombo Plus : ${err?.message ?? err}`, 503, { retryable: true });
    }

    const raw = await this.readResponse(response);
    if (!response.ok || isRejected(raw)) {
      throw new GomboPlusError(responseMessage(raw, `Gombo Plus API HTTP ${response.status}`), response.status, raw);
    }
    return raw as T;
  }

  private buildOperationBody(params: GomboPlusPayinRequest | GomboPlusPayoutRequest) {
    const country = countryKey(params.country_code);
    const operator = gomboPlusOperatorCode(params.operator, country);
    if (!GOMBO_COUNTRIES.has(country) || !operator) {
      throw new GomboPlusError(`Opérateur "${params.operator}" (${country}) non supporté par Gombo Plus.`, 422, {});
    }
    if (operator === "om" && country === "BF") {
      throw new GomboPlusError("Orange Money Burkina Faso est temporairement en maintenance chez Gombo Plus.", 503, {});
    }
    const recipient_number = normalizeRecipientNumber(params.phone, country);
    if (!recipient_number || recipient_number.length < 8) {
      throw new GomboPlusError("Numéro de téléphone invalide pour Gombo Plus.", 422, {});
    }
    return {
      amount: params.amount,
      recipient_number,
      country,
      operator,
      callback_url: params.callback_url,
    };
  }

  async initiatePayin(params: GomboPlusPayinRequest): Promise<GomboPlusPaymentResponse> {
    const response = await this.request<any>("POST", "/api/mobile-services/mobile-deposit/", this.buildOperationBody(params));
    const content = unwrap(response);
    const reference = stringValue(response, ["reference", "transaction_reference", "transactionReference"]);
    if (!reference) throw new GomboPlusError("Gombo Plus n'a pas retourné de référence de transaction.", 502, response);
    return {
      success: true,
      gomboplus_reference: reference,
      status: mapStatus(firstValue(response, ["status", "transaction_status", "payment_status"])),
      payment_url: stringValue(response, ["payment_url", "paymentUrl", "checkout_url", "url"]) || (typeof content === "string" ? content : null),
      message: responseMessage(response, "Paiement Gombo Plus initié."),
    };
  }

  async initiatePayout(params: GomboPlusPayoutRequest): Promise<GomboPlusPaymentResponse> {
    const response = await this.request<any>("POST", "/api/mobile-services/mobile-withdrawal/", this.buildOperationBody(params));
    const reference = stringValue(response, ["reference", "transaction_reference", "transactionReference"]);
    if (!reference) throw new GomboPlusError("Gombo Plus n'a pas retourné de référence de retrait.", 502, response);
    return {
      success: true,
      gomboplus_reference: reference,
      status: mapStatus(firstValue(response, ["status", "transaction_status", "payment_status"])),
      message: responseMessage(response, "Retrait Gombo Plus initié."),
    };
  }

  async getStatus(reference: string): Promise<GomboPlusStatusResponse> {
    const response = await this.request<any>("POST", "/api/mobile-services/check-transaction-status/", {
      transaction_reference: reference,
    });
    const content = unwrap(response);
    const statusValue = firstValue(response, ["status", "transaction_status", "payment_status", "status_message"]);
    const status = mapStatus(statusValue);
    return {
      gomboplus_reference: stringValue(response, ["reference", "transaction_reference", "transactionReference"]) || reference,
      status,
      amount: Number(firstValue(response, ["amount", "total_amount"]) ?? content?.amount ?? 0),
      currency: stringValue(response, ["currency"]) || "XOF",
      failure_reason: status === "failed" ? responseMessage(response, "Transaction Gombo Plus échouée.") : undefined,
    };
  }

  async getBalance(countryCode: string, operator: string): Promise<GomboPlusBalanceResponse> {
    const country = countryKey(countryCode);
    const operatorCode = gomboPlusOperatorCode(operator, country);
    if (!operatorCode) throw new GomboPlusError(`Opérateur "${operator}" (${country}) non supporté par Gombo Plus.`, 422, {});
    const response = await this.request<any>("GET", "/api/wallets/get-balance/", undefined, {
      country_code: country,
      operator_code: operatorCode,
    });
    const content = unwrap(response);
    return {
      balance: Number(content?.balance ?? firstValue(response, ["balance"]) ?? 0),
      currency: String(content?.currency ?? firstValue(response, ["currency"]) ?? "XOF"),
      country_code: String(content?.country_code ?? country),
      operator_code: String(content?.operator_code ?? operatorCode),
      is_active: Boolean(content?.is_active ?? true),
    };
  }
}

let client: GomboPlusClient | null = null;

export function isGomboPlusConfigured(): boolean {
  return Boolean(process.env.GOMBOPLUS_PUBLIC_KEY && process.env.GOMBOPLUS_PRIVATE_KEY);
}

export function getGomboPlusClient(): GomboPlusClient {
  if (client) return client;
  const publicKey = process.env.GOMBOPLUS_PUBLIC_KEY;
  const privateKey = process.env.GOMBOPLUS_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new GomboPlusError(
      "Gombo Plus non configuré. Définissez GOMBOPLUS_PUBLIC_KEY et GOMBOPLUS_PRIVATE_KEY dans les Secrets Replit.",
      503,
      {},
    );
  }
  client = new GomboPlusClient({
    baseUrl: process.env.GOMBOPLUS_BASE_URL ?? DEFAULT_BASE_URL,
    publicKey,
    privateKey,
  });
  return client;
}

export function isAnyGomboPlusConfigured(): boolean {
  return isGomboPlusConfigured();
}