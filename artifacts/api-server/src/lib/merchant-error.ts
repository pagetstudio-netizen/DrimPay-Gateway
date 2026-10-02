/**
 * Message générique renvoyé aux marchands/clients en cas d'échec de transaction.
 *
 * Les noms et messages bruts du fournisseur ne doivent pas apparaître dans les
 * réponses marchandes. La vraie raison de l'échec reste stockée dans
 * `transactions.failureReason` et n'est visible que côté admin (dashboard
 * admin / endpoint /admin/transactions), et est envoyée en temps réel dans
 * le groupe Telegram admin via `notifyTransactionFailure`.
 */
export const GENERIC_ERROR_MESSAGE = "Une erreur s'est produite. Veuillez réessayer plus tard.";

export const MERCHANT_FAILURE_LABEL = "Échoué";

const FAILURE_STATUSES = new Set(["failed", "cancelled", "expired"]);

export type PublicPayinErrorCode =
  | "OPERATOR_UNAVAILABLE"
  | "INVALID_PHONE"
  | "INVALID_CONFIRMATION_CODE"
  | "INSUFFICIENT_FUNDS"
  | "PAYMENT_DECLINED"
  | "PAYMENT_FAILED"
  | "PAYMENT_TEMPORARY_FAILURE"
  | "PAYMENT_UNAVAILABLE"
  | "OTP_REQUIRED"
  | "INVALID_REQUEST"
  | "INVALID_LINK"
  | "PAYMENT_LINK_EXPIRED"
  | "PAYMENT_LINK_UNAVAILABLE"
  | "UNSUPPORTED_COUNTRY"
  | "PHONE_UNAVAILABLE";

const PUBLIC_ERROR_CODES = new Set<PublicPayinErrorCode>([
  "OPERATOR_UNAVAILABLE",
  "INVALID_PHONE",
  "INVALID_CONFIRMATION_CODE",
  "INSUFFICIENT_FUNDS",
  "PAYMENT_DECLINED",
  "PAYMENT_FAILED",
  "PAYMENT_TEMPORARY_FAILURE",
  "PAYMENT_UNAVAILABLE",
  "OTP_REQUIRED",
  "INVALID_REQUEST",
  "INVALID_LINK",
  "PAYMENT_LINK_EXPIRED",
  "PAYMENT_LINK_UNAVAILABLE",
  "UNSUPPORTED_COUNTRY",
  "PHONE_UNAVAILABLE",
]);

const PUBLIC_ERROR_CODE_ALIASES: Record<string, PublicPayinErrorCode> = {
  OPERATOR_MAINTENANCE: "OPERATOR_UNAVAILABLE",
  OPERATOR_NOT_AVAILABLE: "OPERATOR_UNAVAILABLE",
  OPERATOR_DISABLED: "OPERATOR_UNAVAILABLE",
  SERVICE_UNAVAILABLE: "OPERATOR_UNAVAILABLE",
  INVALID_NUMBER: "INVALID_PHONE",
  INVALID_MSISDN: "INVALID_PHONE",
  WRONG_NUMBER: "INVALID_PHONE",
  INVALID_OTP: "INVALID_CONFIRMATION_CODE",
  WRONG_OTP: "INVALID_CONFIRMATION_CODE",
  OTP_INVALID: "INVALID_CONFIRMATION_CODE",
  PIN_INVALID: "INVALID_CONFIRMATION_CODE",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_FUNDS",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  DECLINED: "PAYMENT_DECLINED",
  PAYMENT_REJECTED: "PAYMENT_DECLINED",
  FAILED: "PAYMENT_FAILED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENTS_UNAVAILABLE: "PAYMENT_UNAVAILABLE",
  PAYMENTS_DISABLED: "PAYMENT_UNAVAILABLE",
  PAYMENT_UNAVAILABLE: "PAYMENT_UNAVAILABLE",
  INVALID_REQUEST: "INVALID_REQUEST",
  REQUEST_INVALID: "INVALID_REQUEST",
  NOT_FOUND: "INVALID_LINK",
  LINK_NOT_FOUND: "INVALID_LINK",
  LINK_EXPIRED: "PAYMENT_LINK_EXPIRED",
  LINK_INACTIVE: "PAYMENT_LINK_UNAVAILABLE",
  LINK_EXHAUSTED: "PAYMENT_LINK_UNAVAILABLE",
  PHONE_BLACKLISTED: "PHONE_UNAVAILABLE",
  INVALID_COUNTRY: "UNSUPPORTED_COUNTRY",
};

function normalizeErrorText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Exposes only a customer-safe error category. Raw provider/API details stay
 * in the transaction record and Telegram alert for the operations team.
 */
export function classifyPublicPayinError(reason: unknown): PublicPayinErrorCode {
  const raw = reason instanceof Error
    ? reason.message
    : typeof reason === "string"
      ? reason
      : "";
  const normalized = normalizeErrorText(raw);
  const code = normalized.toUpperCase().replace(/\s+/g, "_");
  if (PUBLIC_ERROR_CODES.has(code as PublicPayinErrorCode)) {
    return code as PublicPayinErrorCode;
  }
  const aliased = PUBLIC_ERROR_CODE_ALIASES[code];
  if (aliased) return aliased;

  if (/\b(introuvable|not found|invalid link)\b/.test(normalized)) {
    return "INVALID_LINK";
  }
  if (/\b(link|lien)\b/.test(normalized) && /\b(expired|expire)\b/.test(normalized)) {
    return "PAYMENT_LINK_EXPIRED";
  }

  const operatorMentioned = /\b(operator|operateur|service|payment method|methode de paiement)\b/.test(normalized);
  if (
    operatorMentioned &&
    /\b(unavailable|indisponible|maintenance|not available|blocked|bloque|suspended|suspendu|inactive|inactif)\b/.test(normalized)
  ) {
    return "OPERATOR_UNAVAILABLE";
  }

  const phoneMentioned = /\b(phone|telephone|numero|number|msisdn|recipient)\b/.test(normalized);
  const invalidInput = /\b(invalid|incorrect|wrong|malformed|not valid|invalide|inexact|non valide|incorrect)\b/.test(normalized);
  if (phoneMentioned && invalidInput) return "INVALID_PHONE";

  const confirmationCodeMentioned = /\b(otp|pin|passcode|confirmation code|code)\b/.test(normalized);
  if (
    confirmationCodeMentioned &&
    /\b(invalid|incorrect|wrong|expired|invalide|expire|incorrect)\b/.test(normalized)
  ) {
    return "INVALID_CONFIRMATION_CODE";
  }

  if (
    /\b(insufficient funds|insufficient balance|not enough funds|low balance|solde insuffisant|fonds insuffisants)\b/.test(normalized)
  ) {
    return "INSUFFICIENT_FUNDS";
  }

  if (/\b(connection refused|econnrefused|connect(?:ion)? reset|socket hang up)\b/.test(normalized)) {
    return "PAYMENT_TEMPORARY_FAILURE";
  }

  if (/\b(declined|rejected|refused|denied|refuse|rejete|non accepte)\b/.test(normalized)) {
    return "PAYMENT_DECLINED";
  }

  if (/\b(failed|failure|echec|echoue|annule|cancelled|canceled|expired|expire)\b/.test(normalized)) {
    return "PAYMENT_FAILED";
  }

  return "PAYMENT_TEMPORARY_FAILURE";
}

/**
 * Retire les détails internes d'une transaction avant de la renvoyer à un marchand.
 * La raison technique reste disponible dans la ligne DB pour l'administration.
 */
export function sanitizeMerchantTransaction<T extends Record<string, unknown>>(transaction: T) {
  const {
    failureReason: _failureReason,
    gatewayPayload: _gatewayPayload,
    ...safeTransaction
  } = transaction;

  return safeTransaction;
}

export function merchantFailureLabel(status: string, failureReason?: unknown) {
  return FAILURE_STATUSES.has(status) || Boolean(failureReason)
    ? MERCHANT_FAILURE_LABEL
    : undefined;
}
