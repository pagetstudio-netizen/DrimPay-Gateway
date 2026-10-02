import assert from "node:assert/strict";
import test from "node:test";
import {
  getCustomerPaymentErrorCode,
  getCustomerPaymentErrorMessage,
} from "../../drimpay/src/lib/payment-error.ts";

test("localizes operator unavailability for public payment pages", () => {
  const french = getCustomerPaymentErrorMessage(
    { code: "OPERATOR_UNAVAILABLE" },
    "Orange Money",
    "fr",
  );
  const english = getCustomerPaymentErrorMessage(
    { code: "OPERATOR_UNAVAILABLE" },
    "Orange Money",
    "en",
  );

  assert.match(french, /Orange Money/);
  assert.match(french, /temporairement indisponible/);
  assert.match(english, /Orange Money/);
  assert.match(english, /temporarily unavailable/);
});

test("maps incorrect phone numbers to safe localized guidance", () => {
  const code = getCustomerPaymentErrorCode("Incorrect phone number from provider");

  assert.equal(code, "INVALID_PHONE");
  assert.match(getCustomerPaymentErrorMessage(code, "Wave", "fr"), /Vérifiez le numéro/);
  assert.match(getCustomerPaymentErrorMessage(code, "Wave", "en"), /check it and try again/i);
});

test("recognizes French and English missing payment links", () => {
  assert.equal(getCustomerPaymentErrorCode("Lien introuvable"), "INVALID_LINK");
  assert.equal(getCustomerPaymentErrorCode("Payment link not found"), "INVALID_LINK");
});

test("keeps connection failures temporary and actual refusals declined", () => {
  assert.equal(
    getCustomerPaymentErrorCode("SQLSTATE 08006 connection refused at gateway"),
    "PAYMENT_TEMPORARY_FAILURE",
  );
  assert.equal(
    getCustomerPaymentErrorCode("Payment was refused by the customer"),
    "PAYMENT_DECLINED",
  );
});

test("never includes unknown provider details in French or English messages", () => {
  const rawFailure = "SQLSTATE 08006 connection refused at gateway";
  const french = getCustomerPaymentErrorMessage(rawFailure, "Wave", "fr");
  const english = getCustomerPaymentErrorMessage(rawFailure, "Wave", "en");

  assert.match(french, /réessayer/);
  assert.match(english, /try again/i);
  assert.equal(french.includes(rawFailure), false);
  assert.equal(english.includes(rawFailure), false);
  assert.equal(french.includes("SQLSTATE"), false);
  assert.equal(english.includes("SQLSTATE"), false);
});