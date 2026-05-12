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

// ── Bucket bootstrap ──────────────────────────────────────────────────────────

export async function ensureKybBucket(): Promise<void> {
  if (!serviceRoleKey) {
    throw new Error(
      "[Storage] SUPABASE_SERVICE_ROLE_KEY is required for KYB document storage. " +
      "Set this variable in your Plesk environment variables."
    );
  }
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
      console.log(`[Storage] Bucket '${KYB_BUCKET}' created in Supabase`);
    } else {
      console.log(`[Storage] Bucket '${KYB_BUCKET}' ready in Supabase`);
    }
  } catch (err: any) {
    console.error("[Storage] Failed to ensure Supabase bucket:", err?.message ?? err);
    throw err;
  }
}

// ── Contract template ─────────────────────────────────────────────────────────

const CONTRACT_TEMPLATE_PATH = "_template/contrat-drimpay.docx";
const CONTRACT_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function uploadContractTemplateBuffer(buffer: Buffer): Promise<void> {
  if (!serviceRoleKey) throw new Error("[Storage] SUPABASE_SERVICE_ROLE_KEY required");
  const { error } = await supabaseAdmin.storage
    .from(KYB_BUCKET)
    .upload(CONTRACT_TEMPLATE_PATH, buffer, { contentType: CONTRACT_MIME, upsert: true });
  if (error) throw new Error(`Contract upload failed: ${error.message}`);
  console.log("[Storage] Contract template uploaded to Supabase");
}

export async function getContractTemplateInfo(): Promise<{ size: number; updatedAt: string } | null> {
  try {
    const folder = CONTRACT_TEMPLATE_PATH.split("/")[0];
    const filename = CONTRACT_TEMPLATE_PATH.split("/").pop()!;
    const { data, error } = await supabaseAdmin.storage
      .from(KYB_BUCKET)
      .list(folder, { search: filename });
    if (error || !data?.length) return null;
    const file = data[0];
    return { size: file.metadata?.size ?? 0, updatedAt: file.updated_at ?? file.created_at ?? "" };
  } catch {
    return null;
  }
}

export async function ensureContractTemplate(): Promise<void> {
  if (!serviceRoleKey) {
    console.warn("[Storage] SUPABASE_SERVICE_ROLE_KEY not set — skipping contract template upload");
    return;
  }
  try {
    const localPath = path.join(process.cwd(), "static", "contrat-drimpay.docx");
    if (!fs.existsSync(localPath)) {
      console.warn("[Storage] Contract template not found on disk — skipping upload");
      return;
    }
    const buffer = fs.readFileSync(localPath);
    const { error } = await supabaseAdmin.storage
      .from(KYB_BUCKET)
      .upload(CONTRACT_TEMPLATE_PATH, buffer, { contentType: CONTRACT_MIME, upsert: true });
    if (error) throw error;
    console.log("[Storage] Contract template uploaded to Supabase");
  } catch (err: any) {
    console.error("[Storage] Failed to upload contract template:", err?.message ?? err);
  }
}

export async function downloadContractTemplate(): Promise<Buffer> {
  if (serviceRoleKey) {
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
    }
  }
  const localPath = path.join(process.cwd(), "static", "contrat-drimpay.docx");
  return fs.readFileSync(localPath);
}

// ── KYB documents — Supabase Storage ONLY ────────────────────────────────────

export async function uploadKybDocument(
  userId: number,
  fieldName: string,
  buffer: Buffer,
  mimetype: string,
  originalName: string,
): Promise<string> {
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. " +
      "KYB documents must be stored in Supabase Storage. " +
      "Please set this environment variable on your server."
    );
  }

  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${fieldName}_${Date.now()}.${ext}`;
  const storagePath = `${userId}/${filename}`;

  const { error } = await supabaseAdmin.storage
    .from(KYB_BUCKET)
    .upload(storagePath, buffer, { contentType: mimetype, upsert: true });

  if (error) {
    throw new Error(`[Storage] Supabase upload failed: ${error.message}`);
  }

  console.log(`[Storage] KYB document uploaded to Supabase: ${storagePath}`);
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
