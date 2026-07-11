// ── Retry helper for transient network/DB/storage errors ────────────────────
// Used to make operations that talk to external services (Supabase Storage,
// Supabase Postgres) resilient to short network blips, which otherwise
// surface as "works sometimes, fails other times" 500 errors to the user.

const TRANSIENT_PATTERNS = [
  "econnreset",
  "econnrefused",
  "etimedout",
  "epipe",
  "enotfound",
  "fetch failed",
  "network",
  "timeout",
  "connection terminated",
  "connection closed",
  "too many clients",
  "sorry, too many clients already",
  "socket hang up",
  "und_err_socket",
  "und_err_connect_timeout",
  "rate limit",
  "too many requests",
  "bad gateway",
  "service unavailable",
  "gateway timeout",
  "502",
  "503",
  "504",
];

// Postgres error codes worth retrying (connection/resource exhaustion related).
const TRANSIENT_PG_CODES = new Set([
  "08000", "08003", "08006", "08001", "08004", // connection exceptions
  "53300", // too_many_connections
  "57P01", "57P02", "57P03", // admin shutdown / crash shutdown / cannot connect now
]);

export function isTransientError(err: any): boolean {
  if (!err) return false;
  const code = err.code ? String(err.code) : "";
  if (TRANSIENT_PG_CODES.has(code)) return true;
  const message = String(err?.message ?? err ?? "").toLowerCase();
  return TRANSIENT_PATTERNS.some((p) => message.includes(p));
}

export interface RetryOptions {
  attempts?: number; // total attempts including the first
  baseDelayMs?: number;
  label?: string;
  isRetryable?: (err: any) => boolean;
}

/**
 * Retries `fn` on transient errors with exponential backoff.
 * Non-transient errors (validation, auth, business logic) are rethrown immediately.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 300;
  const isRetryable = opts.isRetryable ?? isTransientError;
  let lastErr: any;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const retryable = isRetryable(err);
      if (!retryable || attempt === attempts) {
        if (opts.label) {
          console.error(
            `[Retry] ${opts.label} — giving up after ${attempt} attempt(s): ${err?.message ?? err}`
          );
        }
        throw err;
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      if (opts.label) {
        console.warn(
          `[Retry] ${opts.label} — attempt ${attempt}/${attempts} failed (${err?.message ?? err}), retrying in ${delay}ms`
        );
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
