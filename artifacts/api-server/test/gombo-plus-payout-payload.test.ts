import assert from "node:assert/strict";
import test from "node:test";
import { GomboPlusClient } from "../src/lib/gombo-plus";

type FetchCall = {
  url: string;
  init: RequestInit;
};

function mockAcceptedGomboResponse(calls: FetchCall[]) {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    calls.push({
      url: String(input),
      init: init ?? {},
    });

    return new Response(
      JSON.stringify({
        reference: "gombo-payout-reference",
        status: "processing",
      }),
      {
        status: 202,
        headers: { "Content-Type": "application/json" },
      },
    );
  };
}

test("sends the exact Gombo Plus payout payload for Benin and Togo", async () => {
  const originalFetch = globalThis.fetch;
  const calls: FetchCall[] = [];
  globalThis.fetch = mockAcceptedGomboResponse(calls);

  try {
    const client = new GomboPlusClient({
      baseUrl: "https://gombo.test",
      publicKey: "public-key-for-test",
      privateKey: "private-key-for-test",
    });

    const cases = [
      {
        name: "converts DrimPay BJ to provider BN and includes callback_url",
        request: {
          amount: 12500,
          currency: "XOF",
          country_code: "BJ",
          operator: "moov",
          phone: "+229 97 12 34 56",
          reference: "drimpay-bj-moov-1",
          callback_url: "https://merchant.test/webhooks/gombo",
        },
        expected: {
          amount: 12500,
          recipient_number: "97123456",
          country: "BN",
          operator: "moov",
          callback_url: "https://merchant.test/webhooks/gombo",
        },
      },
      {
        name: "sends Togo yas without an optional callback_url",
        request: {
          amount: 8000,
          currency: "XOF",
          country_code: "TG",
          operator: "TMoney",
          phone: "+228 90 12 34 56",
          reference: "drimpay-tg-yas-1",
        },
        expected: {
          amount: 8000,
          recipient_number: "90123456",
          country: "TG",
          operator: "yas",
        },
      },
      {
        name: "sends Togo moov with the provider operator code",
        request: {
          amount: 6500,
          currency: "XOF",
          country_code: "TG",
          operator: "moov",
          phone: "99 12 34 56",
          reference: "drimpay-tg-moov-1",
          callback_url: "  https://merchant.test/webhooks/gombo-tg  ",
        },
        expected: {
          amount: 6500,
          recipient_number: "99123456",
          country: "TG",
          operator: "moov",
          callback_url: "https://merchant.test/webhooks/gombo-tg",
        },
      },
    ];

    for (const testCase of cases) {
      await client.initiatePayout(testCase.request);

      const call = calls.at(-1);
      assert.ok(call, `${testCase.name}: expected one provider request`);
      assert.equal(call.url, "https://gombo.test/api/mobile-services/mobile-withdrawal/");
      assert.equal(call.init.method, "POST");
      assert.deepEqual(JSON.parse(String(call.init.body)), testCase.expected, testCase.name);
    }

    assert.equal(calls.length, cases.length);
  } finally {
    globalThis.fetch = originalFetch;
  }
});