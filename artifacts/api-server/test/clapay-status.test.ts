import assert from "node:assert/strict";
import test from "node:test";
import { ClapayClient } from "../src/lib/clapay";

test("maps documented Clapay SUCCESS and compatible PAID statuses to success", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let providerStatus = "SUCCESS";

  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify({
      signature: "clapay-signature-success",
      transaction_id: "TG-TEST-CLAPAY",
      status: providerStatus,
      amount: 2500,
      currency: "XOF",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const client = new ClapayClient({
      baseUrl: "https://clapay.test/nowallet/api",
      apiToken: "test-api-token",
      secretKey: "",
      webhookSecret: "",
    });

    const result = await client.getStatus("clapay-signature-success");

    assert.equal(result.status, "success");
    assert.equal(result.clapay_reference, "clapay-signature-success");
    assert.equal(result.our_reference, "TG-TEST-CLAPAY");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, "https://clapay.test/nowallet/api/check/status/payment");
    assert.equal(calls[0]?.init.method, "POST");
    assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), {
      signature: "clapay-signature-success",
    });

    providerStatus = "PAID";
    const compatibilityResult = await client.getStatus("clapay-signature-paid");
    assert.equal(compatibilityResult.status, "success");
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});