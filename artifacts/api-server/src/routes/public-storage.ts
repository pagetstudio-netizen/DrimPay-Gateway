import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/storage";
import { isPublicImageBucket, isSafePublicImagePath } from "../lib/public-storage-url";

const router: IRouter = Router();
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

router.get("/public-storage", async (req, res) => {
  const { bucket, path: objectPath } = req.query;
  if (!isPublicImageBucket(bucket) || typeof objectPath !== "string" ||
      !isSafePublicImagePath(bucket, objectPath)) {
    res.status(404).end();
    return;
  }
  if (!supabaseAdmin) {
    res.status(503).end();
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).download(objectPath);
    if (error || !data || data.size > MAX_IMAGE_BYTES) {
      res.status(error || !data ? 404 : 413).end();
      return;
    }

    const contentType = data.type.toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      res.status(415).end();
      return;
    }

    const bytes = Buffer.from(await data.arrayBuffer());
    res
      .status(200)
      .set("Content-Type", contentType)
      .set("X-Content-Type-Options", "nosniff")
      .set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
      .send(bytes);
  } catch {
    res.status(404).end();
  }
});

export default router;