import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyPublicPayinError,
  sanitizeMerchantTransaction,
} from "../src/lib/merchant-error";

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

test("classifies common provider failures without returning technical details", () => {
  assert.equal(
    classifyPublicPayinError("Opérateur indisponible pour le moment"),
    "OPERATOR_UNAVAILABLE",
  );
  assert.equal(
    classifyPublicPayinError("Invalid phone number"),
    "INVALID_PHONE",
  );
  assert.equal(
    classifyPublicPayinError("Le code OTP est incorrect"),
    "INVALID_CONFIRMATION_CODE",
  );
  assert.equal(
    classifyPublicPayinError("SQLSTATE 08006 connection refused at gateway"),
    "PAYMENT_TEMPORARY_FAILURE",
  );
  assert.equal(
    classifyPublicPayinError("Payment was refused by the customer"),
    "PAYMENT_DECLINED",
  );
});