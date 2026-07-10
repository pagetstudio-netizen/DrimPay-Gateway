/**
 * ─── Base URL helpers ─────────────────────────────────────────────────────────
 *
 * Source de vérité unique pour les URLs de base utilisées dans les callbacks
 * vers les agrégateurs de paiement (PayDunya, Clapay) et les redirections
 * frontend.
 *
 * Priorité :
 *   WEBHOOK_BASE_URL  → URL explicite (Plesk, prod, staging)
 *   Fallback          → https://drimpay.com
 *
 * REPLIT_DEV_DOMAIN n'est JAMAIS utilisé ici : les agrégateurs externes ne
 * peuvent pas atteindre les URLs de preview Replit (proxy mTLS, inaccessible).
 */

function normalizeBase(url: string): string {
  return url.trimEnd().replace(/\/+$/, "");
}

/**
 * URL de base pour les webhooks/callbacks envoyés aux agrégateurs de paiement.
 * Utilise WEBHOOK_BASE_URL si défini et non vide, sinon https://drimpay.com.
 */
export function getWebhookBaseUrl(): string {
  const raw = process.env.WEBHOOK_BASE_URL?.trim();
  if (raw) return normalizeBase(raw);
  return "https://drimpay.com";
}

/**
 * URL de base pour les redirections frontend (return_url, success pages, etc.).
 * Utilise FRONTEND_BASE_URL si défini et non vide, sinon https://drimpay.com.
 */
export function getFrontendBaseUrl(): string {
  const raw = process.env.FRONTEND_BASE_URL?.trim();
  if (raw) return normalizeBase(raw);
  return "https://drimpay.com";
}
