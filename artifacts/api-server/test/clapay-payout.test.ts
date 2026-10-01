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

test("queries Clapay single and global balances with Bearer GETs and keeps amounts out of logs", async () => {
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const calls: FetchCall[] = [];
  const logs: string[] = [];
  const responseBodies = [
    { country: "CI", balance: 275000 },
    { currency: "XOF", balance: 875000 },
  ];

  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} });
    const body = responseBodies[calls.length - 1];
    return new Response(JSON.stringify(body), {
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

    assert.deepEqual(await client.getSingleBalance("ci"), {
      country: "CI",
      balance: 275000,
    });
    assert.deepEqual(await client.getGlobalBalance("xof"), {
      currency: "XOF",
      balance: 875000,
    });

    assert.deepEqual(calls.map(call => [call.url, call.init.method]), [
      ["https://clapay.test/nowallet/api/check/transactions/single/balances/CI", "GET"],
      ["https://clapay.test/nowallet/api/check/transactions/global/balances/XOF", "GET"],
    ]);
    assert.ok(calls.every(call =>
      (call.init.headers as Record<string, string>).Authorization === "Bearer test-api-token" &&
      call.init.body === undefined,
    ));
    assert.ok(logs.every(line => !line.includes("275000") && !line.includes("875000")));
    await assert.rejects(() => client.getSingleBalance("../bad"));
    await assert.rejects(() => client.getGlobalBalance("XOF/../CI"));
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
  }
});

test("does not log Clapay balance response bodies for HTML or invalid JSON errors", async () => {
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const originalError = console.error;
  const logs: string[] = [];
  const responses = [
    {
      body: "<!DOCTYPE html><html>BALANCE-SECRET-864209</html>",
      contentType: "text/html",
    },
    {
      body: "invalid response BALANCE-SECRET-975310",
      contentType: "text/plain",
    },
  ];
  let responseIndex = 0;

  globalThis.fetch = async () => {
    const response = responses[responseIndex++];
    return new Response(response.body, {
      status: 502,
      headers: { "Content-Type": response.contentType },
    });
  };
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
  console.error = (...args: unknown[]) => logs.push(args.map(String).join(" "));

  try {
    const client = new ClapayClient({
      baseUrl: "https://clapay.test/nowallet/api",
      apiToken: "test-api-token",
      secretKey: "",
      webhookSecret: "",
    });

    await assert.rejects(() => client.getSingleBalance("CI"));
    await assert.rejects(() => client.getGlobalBalance("XOF"));

    const joinedLogs = logs.join("\n");
    assert.equal(responseIndex, 2);
    assert.equal(joinedLogs.includes("BALANCE-SECRET-864209"), false);
    assert.equal(joinedLogs.includes("BALANCE-SECRET-975310"), false);
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    console.error = originalError;
  }
});