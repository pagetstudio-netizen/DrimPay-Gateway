import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isSafePublicImagePath,
  publicImageProxyUrl,
  rewriteSupabaseUrls,
} from "../src/lib/public-storage-url.js";

test("rewrites public Supabase image URLs to same-origin proxy URLs", () => {
  const original = "https://project.supabase.co/storage/v1/object/public/banner-images/banner_123.png";
  const rewritten = rewriteSupabaseUrls({ imageUrl: original }, "https://project.supabase.co");

  assert.deepEqual(rewritten, {
    imageUrl: "/api/public-storage?bucket=banner-images&path=banner_123.png",
  });
});

test("does not return Supabase URLs for unsupported buckets or paths", () => {
  const privateObject = "https://project.supabase.co/storage/v1/object/private/kyb-documents/1/file.pdf";
  const unsupportedBucket = "https://project.supabase.co/storage/v1/object/public/other/file.png";
  const databaseUrl = "postgresql://user:password@project.supabase.co:5432/postgres";

  assert.equal(rewriteSupabaseUrls(privateObject, "https://project.supabase.co"), null);
  assert.equal(rewriteSupabaseUrls(unsupportedBucket, "https://project.supabase.co"), null);
  assert.equal(rewriteSupabaseUrls(databaseUrl, "https://project.supabase.co"), null);
});

test("keeps unrelated URLs unchanged", () => {
  const external = "https://images.example.test/banner.png";
  assert.equal(rewriteSupabaseUrls(external, "https://project.supabase.co"), external);
});

test("public object paths are restricted to generated image filenames", () => {
  assert.equal(isSafePublicImagePath("banner-images", "banner_123.webp"), true);
  assert.equal(isSafePublicImagePath("payment-link-images", "paylink_123.jpg"), true);
  assert.equal(isSafePublicImagePath("banner-images", "../banner_123.png"), false);
  assert.equal(isSafePublicImagePath("payment-link-images", "paylink_123.svg"), false);
  assert.equal(publicImageProxyUrl("banner-images", "banner_123.png"), "/api/public-storage?bucket=banner-images&path=banner_123.png");
});