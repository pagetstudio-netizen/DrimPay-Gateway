const SENSITIVE_KEY = /(authorization|password|secret|token|private[_-]?key|api[_-]?key|signature|credential|otp|pin|cvv)/i;

function redact(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, entryKey),
      ]),
    );
  }
  return value;
}

/**
 * Keeps the merchant request useful for support without persisting credentials
 * or payment authentication values that may be present in metadata.
 */
export function buildMerchantPayloadSnapshot(body: unknown): Record<string, unknown> {
  const sanitized = redact(body);
  if (sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)) {
    return sanitized as Record<string, unknown>;
  }
  return { payload: sanitized };
}