import assert from "node:assert/strict";
import test from "node:test";
import {
  CLAPAY_PAYMENT_LINK_POLL_OPTIONS,
  CLAPAY_PAYIN_POLL_OPTIONS,
  sendPayinProcessingResponse,
  startPayinStatusPolling,
} from "../src/lib/payin-response";

test("returns the Wave payment URL before blocked status polling settles", async () => {
  const aggregatorResponse = {
    externalRef: "wave-reference-123",
    paymentUrl: "https://pay.wave.example/checkout/wave-reference-123",
  };

  let releasePolling!: () => void;
  const pollingBlocked = new Promise<void>((resolve) => {
    releasePolling = resolve;
  });
  let pollingStarted = false;
  let settlementCalled = false;
  let resolveSettlement!: () => void;
  const settlementFinished = new Promise<void>((resolve) => {
    resolveSettlement = resolve;
  });

  const response: {
    statusCode?: number;
    body?: Record<string, unknown>;
    status: (statusCode: number) => {
      json: (body: Record<string, unknown>) => void;
    };
  } = {
    status(statusCode) {
      response.statusCode = statusCode;
      return {
        json(body) {
          response.body = body;
        },
      };
    },
  };

  startPayinStatusPolling({
    aggregator: "paydunya",
    client: { name: "wave-test-client" },
    externalRef: aggregatorResponse.externalRef,
    transactionId: 42,
    reference: "SN-TEST-WAVE",
  }, {
    pollUntilSettled: async () => {
      pollingStarted = true;
      await pollingBlocked;
      return {
        status: "success",
        gatewayReference: aggregatorResponse.externalRef,
      };
    },
    settlePayinStatus: async (params) => {
      settlementCalled = true;
      assert.equal(params.status, "success");
      resolveSettlement();
    },
  });

  sendPayinProcessingResponse(response, {
    reference: "SN-TEST-WAVE",
    order_id: "order-wave-123",
    payment_url: aggregatorResponse.paymentUrl,
    gateway_reference: aggregatorResponse.externalRef,
  });

  assert.equal(pollingStarted, true);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body?.status, "processing");
  assert.equal(response.body?.verified_status, "processing");
  assert.equal(response.body?.payment_url, aggregatorResponse.paymentUrl);
  assert.equal(settlementCalled, false);

  releasePolling();
  await settlementFinished;
  assert.equal(settlementCalled, true);
});

test("Clapay pay-in status checks start after seven seconds and stop after five attempts", async () => {
  let receivedOptions: unknown;
  let resolvePollingComplete!: () => void;
  const pollingComplete = new Promise<void>((resolve) => {
    resolvePollingComplete = resolve;
  });

  startPayinStatusPolling({
    aggregator: "clapay",
    client: { name: "clapay-test-client" },
    externalRef: "clapay-provider-reference",
    transactionId: 43,
    reference: "TG-TEST-CLAPAY",
  }, {
    pollUntilSettled: async (_aggregator, _client, _reference, options) => {
      receivedOptions = options;
      return {
        status: "processing",
        gatewayReference: "clapay-provider-reference",
      };
    },
    settlePayinStatus: async (params) => {
      assert.equal(params.status, "processing");
      resolvePollingComplete();
    },
  });

  await pollingComplete;
  assert.deepEqual(receivedOptions, CLAPAY_PAYIN_POLL_OPTIONS);
});

test("Clapay payment links use the full customer confirmation window", async () => {
  let receivedOptions: unknown;
  let resolvePollingComplete!: () => void;
  const pollingComplete = new Promise<void>((resolve) => {
    resolvePollingComplete = resolve;
  });

  startPayinStatusPolling({
    aggregator: "clapay",
    client: { name: "clapay-link-test-client" },
    externalRef: "clapay-link-provider-reference",
    transactionId: 44,
    reference: "TG-TEST-CLAPAY-LINK",
    pollingOptions: CLAPAY_PAYMENT_LINK_POLL_OPTIONS,
  }, {
    pollUntilSettled: async (_aggregator, _client, _reference, options) => {
      receivedOptions = options;
      return {
        status: "processing",
        gatewayReference: "clapay-link-provider-reference",
      };
    },
    settlePayinStatus: async (params) => {
      assert.equal(params.status, "processing");
      resolvePollingComplete();
    },
  });

  await pollingComplete;
  assert.deepEqual(receivedOptions, {
    intervalMs: 7_000,
    maxDurationMs: 185_000,
    initialDelayMs: 7_000,
    maxAttempts: 25,
    operation: "payin",
  });
});