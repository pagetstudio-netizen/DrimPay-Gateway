import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeMerchantTransaction } from "../src/lib/merchant-error";

test("does not expose gateway payloads, names, or failure reasons to merchants", () => {
  const sanitized = sanitizeMerchantTransaction({
    id: 7,
    reference: "PAY-TEST-7",
    failureReason: "provider internal response",
    gatewayPayload: JSON.stringify({
      gateway: "clapay",
      request_body: { private_info: "must not be returned" },
    }),
  });

  assert.equal(sanitized.reference, "PAY-TEST-7");
  assert.equal("failureReason" in sanitized, false);
  assert.equal("gatewayPayload" in sanitized, false);
  assert.equal("gatewayName" in sanitized, false);
});