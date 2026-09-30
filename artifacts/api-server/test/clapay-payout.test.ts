import assert from "node:assert/strict";
import test from "node:test";
import { buildGatewayPayloadSnapshot } from "../src/lib/gateway-payload";
import { buildMerchantPayloadSnapshot } from "../src/lib/merchant-payload";
import { ClapayClient } from "../src/lib/clapay";

type FetchCall = {
  url: string;
  init: RequestInit;
};

test("initiates a Clapay payout as CASHIN over the API tunnel", async () => {
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const calls: FetchCall[] = [];
  const logs: string[] = [];
  let responseBody: Record<string, unknown> = {
    signature: "clapay-signature-1",
    status_payment: "INITIATED",
    message: "Transaction will be processed",
  };

  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));

  try {
    const client = new ClapayClient({
      baseUrl: "https://clapay.test/nowallet/api",
      apiToken: "test-api-token",
      secretKey: "",
      webhookSecret: "",
    });
    const payoutRequest = {
      amount: 12500,
      currency: "XOF",
      country_code: "CI",
      operator: "Orange Money",
      phone: "+225 07 00 00 00 00",
      reference: "OUT-TEST-001",
      callback_url: "https://merchant.test/webhooks/clapay",
      operator_otp: "123456",
    };

    const accepted = await client.initiatePayout(payoutRequest);
    assert.deepEqual(accepted, {
      success: true,
      clapay_reference: "clapay-signature-1",
      status: "pending",
      message: "Transaction will be processed",
    });

    const firstCall = calls[0];
    assert.ok(firstCall);
    assert.equal(firstCall.url, "https://clapay.test/nowallet/api/init/payment");
    assert.equal(firstCall.init.method, "POST");
    assert.equal(
      (firstCall.init.headers as Record<string, string>).Authorization,
      "Bearer test-api-token",
    );
    assert.deepEqual(JSON.parse(String(firstCall.init.body)), {
      transaction_id: "OUT-TEST-001",
      amount: 12500,
      callback_url: "https://merchant.test/webhooks/clapay",
      return_url: "https://merchant.test/webhooks/clapay",
      country_code: "CI",
      operators_code: ["OM"],
      method: "CASHIN",
      tunnel: "API",
      additional_infos: { customer_phone: "+225 07 00 00 00 00" },
      operator_otp: "123456",
    });
    assert.ok(logs.some((line) => line.includes('"operator_otp":"***"')));
    assert.ok(logs.every((line) => !line.includes("123456")));

    responseBody = {
      signature: "clapay-signature-failed",
      status_payment: "FAILED",
      message: "Payout rejected",
    };
    const rejected = await client.initiatePayout(payoutRequest);
    assert.equal(rejected.success, false);
    assert.equal(rejected.status, "failed");
    assert.equal(rejected.message, "Payout rejected");

    const snapshot = buildGatewayPayloadSnapshot({
      gateway: "clapay",
      operation: "payout",
      amount: payoutRequest.amount,
      currency: payoutRequest.currency,
      country_code: payoutRequest.country_code,
      operator: payoutRequest.operator,
      phone: payoutRequest.phone,
      reference: payoutRequest.reference,
      callback_url: payoutRequest.callback_url,
      operator_otp: payoutRequest.operator_otp,
    });
    assert.deepEqual(snapshot, {
      gateway: "clapay",
      method: "POST",
      endpoint: "/init/payment",
      request_body: {
        transaction_id: "OUT-TEST-001",
        amount: 12500,
        callback_url: "https://merchant.test/webhooks/clapay",
        country_code: "CI",
        operators_code: ["OM"],
        method: "CASHIN",
        tunnel: "API",
        additional_infos: { customer_phone: "+225 07 00 00 00 00" },
        return_url: "https://merchant.test/webhooks/clapay",
      },
    });
    assert.equal(JSON.stringify(snapshot).includes("123456"), false);
    assert.deepEqual(
      buildMerchantPayloadSnapshot({ operatorOtp: payoutRequest.operator_otp }),
      { operatorOtp: "[REDACTED]" },
    );
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
  }
});