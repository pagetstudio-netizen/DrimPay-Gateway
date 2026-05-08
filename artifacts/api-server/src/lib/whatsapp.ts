import { db } from "@workspace/db";
import { adminSettingsTable } from "@workspace/db/schema";

interface WaConfig {
  instanceId: string;
  token: string;
  adminNumber: string;
}

let _waCache: (WaConfig & { at: number }) | null = null;
const WA_TTL = 60_000;

export function invalidateWhatsAppCache() { _waCache = null; }

async function getConfig(): Promise<WaConfig | null> {
  const now = Date.now();
  if (_waCache && now - _waCache.at < WA_TTL) return _waCache;
  try {
    const rows = await db.select().from(adminSettingsTable);
    const m = Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
    const instanceId = m["whatsapp_instance_id"] ?? "";
    const token = m["whatsapp_token"] ?? "";
    const adminNumber = m["whatsapp_admin_number"] ?? "";
    if (!instanceId || !token || !adminNumber) return null;
    _waCache = { instanceId, token, adminNumber, at: now };
    return _waCache;
  } catch {
    return null;
  }
}

export async function sendWhatsAppContractNotification(opts: {
  merchantName: string;
  companyName: string;
  country: string;
  contractEmail: string;
  kybId: number;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getConfig();
  if (!cfg) {
    console.warn("[WhatsApp] Non configuré — notification ignorée.");
    return { ok: false, error: "WhatsApp non configuré" };
  }

  const msg =
    `✅ *Nouveau contrat DrimPay signé*\n\n` +
    `🏢 *Marchand :* ${opts.companyName}\n` +
    `👤 *Représentant :* ${opts.merchantName}\n` +
    `🌍 *Pays :* ${opts.country}\n` +
    `📧 *Email :* ${opts.contractEmail}\n` +
    `🔖 *Dossier KYB :* #${opts.kybId}\n\n` +
    `Le contrat a été généré et envoyé par email au marchand. ` +
    `Veuillez procéder à la vérification du dossier sous 24–72h.`;

  try {
    const url = `https://api.ultramsg.com/${cfg.instanceId}/messages/chat`;
    const body = new URLSearchParams({
      token: cfg.token,
      to: cfg.adminNumber,
      body: msg,
    });

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json() as any;
    if (!r.ok || data?.sent === "false" || data?.error) {
      const err = data?.error ?? `HTTP ${r.status}`;
      console.error("[WhatsApp] Erreur envoi:", err);
      return { ok: false, error: err };
    }

    console.log(`[WhatsApp] Notification contrat envoyée au ${cfg.adminNumber}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[WhatsApp] Exception:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}
