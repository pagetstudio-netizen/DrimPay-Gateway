import assert from "node:assert/strict";
import test from "node:test";
import { decidePayoutSyncAction, payoutAggregatorFromSnapshot } from "../src/lib/payout-admin-status";

test("reads the original payout gateway from the stored snapshot", () => {
  assert.equal(payoutAggregatorFromSnapshot('{"gateway":"clapay"}'), "clapay");
  assert.equal(payoutAggregatorFromSnapshot('{"gateway":"paydunya"}'), "paydunya");
  assert.equal(payoutAggregatorFromSnapshot('{"gateway":"babimo"}'), "babimo");
  assert.equal(payoutAggregatorFromSnapshot('{"gateway":"Gombo Plus"}'), "gomboplus");
  assert.equal(payoutAggregatorFromSnapshot('{"gateway":"gombo_plus"}'), "gomboplus");
  assert.equal(payoutAggregatorFromSnapshot('{"gateway":"unrecognized"}'), null);
  assert.equal(payoutAggregatorFromSnapshot("{invalid"), null);
  assert.equal(payoutAggregatorFromSnapshot(null), null);
});

test("only synchronizes or refunds non-final payout transactions", () => {
  assert.equal(decidePayoutSyncAction("pending", "success"), "complete");
  assert.equal(decidePayoutSyncAction("processing", "failed"), "refund");
  assert.equal(decidePayoutSyncAction("pending", "cancelled"), "refund");
  assert.equal(decidePayoutSyncAction("processing", "processing"), "wait");

  // A provider mismatch on a manually approved/settled row must never refund it.
  assert.equal(decidePayoutSyncAction("success", "failed"), "unchanged");
  assert.equal(decidePayoutSyncAction("failed", "success"), "unchanged");
});