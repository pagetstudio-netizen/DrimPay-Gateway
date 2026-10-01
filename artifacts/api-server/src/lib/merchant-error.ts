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
