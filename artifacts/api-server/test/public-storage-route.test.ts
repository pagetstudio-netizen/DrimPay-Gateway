import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import { test } from "node:test";

test("public storage proxy serves bounded images and rejects invalid upstream content", async () => {
  const originalFetch = globalThis.fetch;
  const priorUrl = process.env["SUPABASE_URL"];
  const priorServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  let upstreamStatus = 200;
  let upstreamContentType = "image/png";
  let upstreamBody = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  const upstreamPaths: string[] = [];

  process.env["SUPABASE_URL"] = "https://supabase.example.test";
  process.env["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role-key";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const requestUrl = input instanceof Request ? input.url : String(input);
    upstreamPaths.push(new URL(requestUrl).pathname);
    return new Response(upstreamBody, {
      status: upstreamStatus,
      headers: { "content-type": upstreamContentType },
    });
  }) as typeof globalThis.fetch;

  try {
    const { default: publicStorageRouter } = await import("../src/routes/public-storage.js");
    const app = express();
    app.use("/api", publicStorageRouter);
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
      const address = server.address() as AddressInfo;
      const get = (query: string) =>
        originalFetch(`http://127.0.0.1:${address.port}/api/public-storage?${query}`);

      const image = await get("bucket=banner-images&path=banner_123.png");
      assert.equal(image.status, 200);
      assert.equal(image.headers.get("content-type"), "image/png");
      assert.equal(image.headers.get("x-content-type-options"), "nosniff");
      assert.deepEqual(Buffer.from(await image.arrayBuffer()), upstreamBody);
      assert.deepEqual(upstreamPaths, ["/storage/v1/object/banner-images/banner_123.png"]);

      upstreamBody = Buffer.alloc(5 * 1024 * 1024 + 1);
      const oversized = await get("bucket=banner-images&path=banner_456.png");
      assert.equal(oversized.status, 413);

      upstreamBody = Buffer.from("not an image");
      upstreamContentType = "text/html";
      const unsupportedType = await get("bucket=banner-images&path=banner_789.png");
      assert.equal(unsupportedType.status, 415);

      const callsBeforeInvalidPath = upstreamPaths.length;
      const invalidPath = await get("bucket=banner-images&path=..%2Fsecret.png");
      assert.equal(invalidPath.status, 404);
      assert.equal(upstreamPaths.length, callsBeforeInvalidPath);
    } finally {
      server.close();
      await once(server, "close");
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (priorUrl === undefined) delete process.env["SUPABASE_URL"];
    else process.env["SUPABASE_URL"] = priorUrl;
    if (priorServiceRoleKey === undefined) delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    else process.env["SUPABASE_SERVICE_ROLE_KEY"] = priorServiceRoleKey;
  }
});