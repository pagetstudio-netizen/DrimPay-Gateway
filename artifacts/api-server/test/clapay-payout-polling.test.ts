import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLAPAY_PAYOUT_POLL_OPTIONS,
  pollUntilSettled,
} from "../src/lib/aggregator-router";
import type { ClapayClient } from "../src/lib/clapay";

test("Clapay payout polling uses 10-second spacing and a five-check limit", () => {
  assert.deepEqual(CLAPAY_PAYOUT_POLL_OPTIONS, {
    intervalMs: 10_000,
    maxDurationMs: 60_000,
    initialDelayMs: 10_000,
    maxAttempts: 5,
    operation: "payout",
  });
});

test("payout polling stops after the configured maximum number of checks", async () => {
  let calls = 0;
  const client = {
    getStatus: async () => {
      calls += 1;
      return {
        clapay_reference: "provider-ref",
        our_reference: "merchant-ref",
        status: "processing" as const,
        amount: 0,
        currency: "XOF",
        operator: "",
        phone: "",
      };
    },
  } as unknown as ClapayClient;

  const result = await pollUntilSettled("clapay", client, "provider-ref", {
    intervalMs: 1,
    maxDurationMs: 100,
    initialDelayMs: 1,
    maxAttempts: 5,
    operation: "payout",
  });

  assert.equal(calls, 5);
  assert.equal(result?.status, "processing");
});

test("payout polling stops early when Clapay returns a final status", async () => {
  let calls = 0;
  const client = {
    getStatus: async () => {
      calls += 1;
      return {
        clapay_reference: "provider-ref",
        our_reference: "merchant-ref",
        status: calls === 2 ? "success" as const : "processing" as const,
        amount: 0,
        currency: "XOF",
        operator: "",
        phone: "",
      };
    },
  } as unknown as ClapayClient;

  const result = await pollUntilSettled("clapay", client, "provider-ref", {
    intervalMs: 1,
    maxDurationMs: 100,
    initialDelayMs: 1,
    maxAttempts: 5,
    operation: "payout",
  });

  assert.equal(calls, 2);
  assert.equal(result?.status, "success");
});