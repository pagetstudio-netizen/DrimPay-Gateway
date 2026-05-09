import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://zbootwjgztirlixmaclu.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY!;

if (!anonKey) throw new Error("SUPABASE_ANON_KEY must be set");

// Admin client (service role) — bypasses RLS, used for bucket management and file operations
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

const BUCKET = "kyb-documents";

// Ensure the bucket exists on startup
export async function ensureKybBucket(): Promise<void> {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.id === BUCKET);
    if (!exists) {
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024, // 10 MB
        allowedMimeTypes: [
          "image/jpeg", "image/jpg", "image/png", "image/gif",
          "image/webp", "image/heic", "application/pdf",
        ],
      });
      if (error) throw error;
      console.log(`[Storage] Bucket '${BUCKET}' created`);
    } else {
      console.log(`[Storage] Bucket '${BUCKET}' already exists`);
    }
  } catch (err: any) {
    console.error("[Storage] Failed to ensure bucket:", err?.message ?? err);
  }
}

export async function uploadKybDocument(
  userId: number,
  fieldName: string,
  buffer: Buffer,
  mimetype: string,
  originalName: string,
): Promise<string> {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const storagePath = `${userId}/${fieldName}_${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimetype, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

export async function downloadKybDocument(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(storagePath);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteKybDocument(storagePath: string): Promise<void> {
  await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
}
