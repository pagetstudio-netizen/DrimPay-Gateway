const PUBLIC_IMAGE_BUCKETS = ["banner-images", "payment-link-images"] as const;

export type PublicImageBucket = (typeof PUBLIC_IMAGE_BUCKETS)[number];

export function isPublicImageBucket(value: unknown): value is PublicImageBucket {
  return typeof value === "string" && PUBLIC_IMAGE_BUCKETS.includes(value as PublicImageBucket);
}

export function isSafePublicImagePath(bucket: PublicImageBucket, objectPath: string): boolean {
  if (objectPath.length > 128 || objectPath.includes("/") || objectPath.includes("\\")) return false;
  const prefix = bucket === "banner-images" ? "banner_" : "paylink_";
  return new RegExp(`^${prefix}\\d+\\.(?:jpe?g|png|webp|gif)$`, "i").test(objectPath);
}

export function publicImageProxyUrl(bucket: PublicImageBucket, objectPath: string): string {
  if (!isSafePublicImagePath(bucket, objectPath)) {
    throw new Error("Invalid public image path");
  }
  const query = new URLSearchParams({ bucket, path: objectPath });
  return `/api/public-storage?${query.toString()}`;
}

function rewriteSupabaseUrl(value: string, configuredUrl?: string): string | null {
  if (/^postgres(?:ql)?:\/\//i.test(value)) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }

  let configuredOrigin: string | undefined;
  try {
    configuredOrigin = configuredUrl ? new URL(configuredUrl).origin : undefined;
  } catch {
    configuredOrigin = undefined;
  }

  const isSupabaseProjectUrl =
    (configuredOrigin !== undefined && url.origin === configuredOrigin) ||
    url.hostname.endsWith(".supabase.co") ||
    url.hostname.endsWith(".supabase.in");
  if (!isSupabaseProjectUrl) return value;

  const publicPrefix = "/storage/v1/object/public/";
  if (!url.pathname.startsWith(publicPrefix)) return null;

  try {
    const remainder = url.pathname.slice(publicPrefix.length);
    const separator = remainder.indexOf("/");
    if (separator <= 0) return null;

    const bucket = decodeURIComponent(remainder.slice(0, separator));
    const objectPath = decodeURIComponent(remainder.slice(separator + 1));
    if (!isPublicImageBucket(bucket) || !isSafePublicImagePath(bucket, objectPath)) return null;

    return publicImageProxyUrl(bucket, objectPath);
  } catch {
    return null;
  }
}

export function rewriteSupabaseUrls<T>(value: T, configuredUrl = process.env.SUPABASE_URL): T {
  if (typeof value === "string") {
    return rewriteSupabaseUrl(value, configuredUrl) as T;
  }
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) {
    return value.map((item) => rewriteSupabaseUrls(item, configuredUrl)) as T;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, rewriteSupabaseUrls(item, configuredUrl)]),
  ) as T;
}