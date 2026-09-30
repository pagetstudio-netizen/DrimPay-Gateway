import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultCountryFee,
  operatorFeeConfigKey,
  parseCountryFeeDefaults,
  parseOperatorFeeRates,
  resolveFeeRate,
} from "../src/lib/fee-rates";

test("defaults Pay-in and Pay-out to 4.5% for Togo, Senegal, and Mali", () => {
  for (const countryCode of ["TG", "SN", "ML"]) {
    assert.equal(defaultCountryFee(countryCode, "payin"), 0.045);
    assert.equal(defaultCountryFee(countryCode, "payout"), 0.045);
  }
  assert.equal(defaultCountryFee("BF", "payin"), null);
});

test("configured country defaults override special defaults, including zero rates", () => {
  const defaults = parseCountryFeeDefaults(JSON.stringify({
    " tg ": { payin: 6.25, payout: 0 },
  }));

  assert.equal(defaultCountryFee("TG", "payin", defaults), 0.0625);
  assert.equal(defaultCountryFee("TG", "payout", defaults), 0);
  assert.equal(defaultCountryFee("SN", "payin", defaults), 0.045);
});

test("resolves merchant, operator, country, then platform rates in priority order", () => {
  const operatorRates = parseOperatorFeeRates(JSON.stringify({
    [operatorFeeConfigKey("TG", "Orange Money")]: { payin: 8, payout: 7 },
  }));
  const countryDefaults = parseCountryFeeDefaults(JSON.stringify({
    TG: { payin: 5, payout: 4.75 },
  }));

  assert.equal(resolveFeeRate("payin", 2.5, "TG", "Orange Money", operatorRates, countryDefaults, 0.035), 0.025);
  assert.equal(resolveFeeRate("payout", null, "TG", "Orange Money", operatorRates, countryDefaults, 0.035), 0.07);
  assert.equal(resolveFeeRate("payin", null, "TG", "TMoney", operatorRates, countryDefaults, 0.035), 0.05);
  assert.equal(resolveFeeRate("payin", null, "BJ", "MTN MoMo", operatorRates, countryDefaults, 0.035), 0.035);
});

test("normalizes operator keys and ignores invalid configured percentages", () => {
  assert.equal(operatorFeeConfigKey(" sn ", "Orange Money"), "SN:orange");

  const operatorRates = parseOperatorFeeRates(JSON.stringify({
    "SN:orange": { payin: 5.5, payout: -1 },
  }));
  assert.equal(operatorRates["SN:orange"]?.payin, 5.5);
  assert.equal(operatorRates["SN:orange"]?.payout, null);
  assert.deepEqual(parseCountryFeeDefaults("{invalid"), {});
});