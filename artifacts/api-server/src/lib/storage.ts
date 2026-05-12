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

// Local fallback directory when Supabase Storage is unavailable
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads", "kyb");

function ensureLocalDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Path within kyb-documents bucket for the contract template
const CONTRACT_TEMPLATE_PATH = "_template/contrat-drimpay.docx";
const CONTRACT_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// ── Bucket bootstrap ──────────────────────────────────────────────────────────

export async function ensureKybBucket(): Promise<void> {
  if (!serviceRoleKey) {
    console.warn("[Storage] SUPABASE_SERVICE_ROLE_KEY not set — using local disk fallback for KYB documents");
    ensureLocalDir(LOCAL_UPLOADS_DIR);
    return;
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
      console.log(`[Storage] Bucket '${KYB_BUCKET}' created`);
    } else {
      console.log(`[Storage] Bucket '${KYB_BUCKET}' ready`);
    }
  } catch (err: any) {
    console.error("[Storage] Failed to ensure bucket:", err?.message ?? err);
    ensureLocalDir(LOCAL_UPLOADS_DIR);
  }
}

// ── Contract template ─────────────────────────────────────────────────────────

export async function uploadContractTemplateBuffer(buffer: Buffer): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(KYB_BUCKET)
    .upload(CONTRACT_TEMPLATE_PATH, buffer, {
      contentType: CONTRACT_MIME,
      upsert: true,
    });
  if (error) throw new Error(`Contract upload failed: ${error.message}`);
  console.log("[Storage] Contract template replaced by admin");
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

// ── KYB documents ─────────────────────────────────────────────────────────────

export async function uploadKybDocument(
  userId: number,
  fieldName: string,
  buffer: Buffer,
  mimetype: string,
  originalName: string,
): Promise<string> {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${fieldName}_${Date.now()}.${ext}`;
  const storagePath = `${userId}/${filename}`;

  // Try Supabase Storage first (when service role key is available)
  if (serviceRoleKey) {
    const { error } = await supabaseAdmin.storage
      .from(KYB_BUCKET)
      .upload(storagePath, buffer, { contentType: mimetype, upsert: true });

    if (!error) return storagePath;
    console.warn(`[Storage] Supabase upload failed (${error.message}), falling back to local disk`);
  }

  // Local disk fallback
  const userDir = path.join(LOCAL_UPLOADS_DIR, String(userId));
  ensureLocalDir(userDir);
  const localFilePath = path.join(userDir, filename);
  fs.writeFileSync(localFilePath, buffer);
  console.log(`[Storage] Document saved locally: ${localFilePath}`);
  return `local:${storagePath}`;
}

export async function downloadKybDocument(storagePath: string): Promise<Buffer> {
  // Local fallback
  if (storagePath.startsWith("local:")) {
    const relativePath = storagePath.slice("local:".length);
    const localFilePath = path.join(LOCAL_UPLOADS_DIR, relativePath);
    if (!fs.existsSync(localFilePath)) throw new Error(`Local file not found: ${localFilePath}`);
    return fs.readFileSync(localFilePath);
  }

  const { data, error } = await supabaseAdmin.storage.from(KYB_BUCKET).download(storagePath);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteKybDocument(storagePath: string): Promise<void> {
  if (storagePath.startsWith("local:")) {
    const relativePath = storagePath.slice("local:".length);
    const localFilePath = path.join(LOCAL_UPLOADS_DIR, relativePath);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return;
  }
  await supabaseAdmin.storage.from(KYB_BUCKET).remove([storagePath]);
}
