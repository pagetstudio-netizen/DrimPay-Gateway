import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeMerchantTransaction } from "../src/lib/merchant-error";

test("exposes only an allowlisted gateway name in merchant transaction data", () => {
  const sanitized = sanitizeMerchantTransaction({
    id: 7,
    reference: "PAY-TEST-7",
    failureReason: "provider internal response",
    gatewayPayload: JSON.stringify({
      gateway: "clapay",
      request_body: { private_info: "must not be returned" },
    }),
  });

  assert.equal(sanitized.gatewayName, "Clapay");
  assert.equal(sanitized.reference, "PAY-TEST-7");
  assert.equal("failureReason" in sanitized, false);
  assert.equal("gatewayPayload" in sanitized, false);
});

test("does not expose unknown or malformed gateway snapshots", () => {
  assert.equal(
    sanitizeMerchantTransaction({ gatewayPayload: JSON.stringify({ gateway: "unknown" }) }).gatewayName,
    null,
  );
  assert.equal(
    sanitizeMerchantTransaction({ gatewayPayload: "{broken" }).gatewayName,
    null,
  );
  assert.equal(
    sanitizeMerchantTransaction({ gatewayPayload: null }).gatewayName,
    null,
  );
});