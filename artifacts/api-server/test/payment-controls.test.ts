import assert from "node:assert/strict";
import { test } from "node:test";
import { arePaymentControlsEnabled } from "../src/lib/admin-settings.js";

test("payment operations stay enabled when no availability settings exist", () => {
  assert.equal(arePaymentControlsEnabled(17, "payin", []), true);
  assert.equal(arePaymentControlsEnabled(17, "payout", []), true);
});

test("the global pay-in switch disables pay-in but does not affect payout", () => {
  const settings = [{ key: "payins_enabled", value: "false" }];
  assert.equal(arePaymentControlsEnabled(17, "payin", settings), false);
  assert.equal(arePaymentControlsEnabled(17, "payout", settings), true);
});

test("merchant controls only affect the selected merchant and operation", () => {
  const settings = [
    { key: "merchant:17:payin_enabled", value: "false" },
    { key: "merchant:17:payout_enabled", value: "false" },
  ];

  assert.equal(arePaymentControlsEnabled(17, "payin", settings), false);
  assert.equal(arePaymentControlsEnabled(17, "payout", settings), false);
  assert.equal(arePaymentControlsEnabled(18, "payin", settings), true);
  assert.equal(arePaymentControlsEnabled(18, "payout", settings), true);
});

test("unrecognized stored values fail closed", () => {
  assert.equal(
    arePaymentControlsEnabled(17, "payin", [{ key: "payins_enabled", value: null }]),
    false,
  );
});