import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.SUPABASE_URL || "https://zbootwjgztirlixmaclu.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY!;

if (!anonKey) throw new Error("SUPABASE_ANON_KEY must be set");

// Admin client (service role) — bypasses RLS, used for bucket management and file operations
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

const KYB_BUCKET = "kyb-documents";

// Path within kyb-documents bucket for the contract template
const CONTRACT_TEMPLATE_PATH = "_template/contrat-drimpay.docx";
const CONTRACT_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// ── Bucket bootstrap ──────────────────────────────────────────────────────────

export async function ensureKybBucket(): Promise<void> {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.id === KYB_BUCKET);
    if (!exists) {
      const { error } = await supabaseAdmin.storage.createBucket(KYB_BUCKET, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: [
          "image/jpeg", "image/jpg", "image/png", "image/gif",
          "image/webp", "image/heic", "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      });
      if (error) throw error;
      console.log(`[Storage] Bucket '${KYB_BUCKET}' created`);
    } else {
      console.log(`[Storage] Bucket '${KYB_BUCKET}' ready`);
    }
  } catch (err: any) {
    console.error("[Storage] Failed to ensure bucket:", err?.message ?? err);
  }
}

// ── Contract template ─────────────────────────────────────────────────────────

/**
 * Upload the contract DOCX template from disk to Supabase on first startup.
 * Uses upsert so re-deployments always keep the latest version in sync.
 */
export async function ensureContractTemplate(): Promise<void> {
  try {
    const localPath = path.join(process.cwd(), "static", "contrat-drimpay.docx");
    if (!fs.existsSync(localPath)) {
      console.warn("[Storage] Contract template not found on disk — skipping upload");
      return;
    }
    const buffer = fs.readFileSync(localPath);
    const { error } = await supabaseAdmin.storage
      .from(KYB_BUCKET)
      .upload(CONTRACT_TEMPLATE_PATH, buffer, {
        contentType: CONTRACT_MIME,
        upsert: true,
      });
    if (error) throw error;
    console.log("[Storage] Contract template uploaded to Supabase");
  } catch (err: any) {
    console.error("[Storage] Failed to upload contract template:", err?.message ?? err);
  }
}

/**
 * Download the contract DOCX template from Supabase.
 * Falls back to disk if Supabase is unavailable.
 */
export async function downloadContractTemplate(): Promise<Buffer> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(KYB_BUCKET)
      .download(CONTRACT_TEMPLATE_PATH);
    if (error || !data) throw new Error(error?.message ?? "no data");
    const ab = await data.arrayBuffer();
    console.log("[Storage] Contract template downloaded from Supabase");
    return Buffer.from(ab);
  } catch (err: any) {
    console.warn("[Storage] Supabase contract download failed, falling back to disk:", err?.message ?? err);
    const localPath = path.join(process.cwd(), "static", "contrat-drimpay.docx");
    return fs.readFileSync(localPath);
  }
}

// ── KYB documents ─────────────────────────────────────────────────────────────

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
    .from(KYB_BUCKET)
    .upload(storagePath, buffer, { contentType: mimetype, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

export async function downloadKybDocument(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage.from(KYB_BUCKET).download(storagePath);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteKybDocument(storagePath: string): Promise<void> {
  await supabaseAdmin.storage.from(KYB_BUCKET).remove([storagePath]);
}
