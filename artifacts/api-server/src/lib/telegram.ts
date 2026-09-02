import { db } from "@workspace/db";
import { adminSettingsTable, usersTable, transactionsTable, blockedIpsTable, walletExchangesTable, walletsTable } from "@workspace/db/schema";
import { eq, and, gte, lt, sum, count, desc } from "drizzle-orm";
import { approveWalletExchange, rejectWalletExchange } from "./wallet-exchange-service";

// ─── Country meta for wallet summary display ──────────────────────────────────
const COUNTRY_META: Record<string, { flag: string; name: string }> = {
  TG: { flag: "🇹🇬", name: "Togo" },
  BJ: { flag: "🇧🇯", name: "Bénin" },
  CI: { flag: "🇨🇮", name: "Côte d'Ivoire" },
  SN: { flag: "🇸🇳", name: "Sénégal" },
  BF: { flag: "🇧🇫", name: "Burkina Faso" },
  GN: { flag: "🇬🇳", name: "Guinée" },
  ML: { flag: "🇲🇱", name: "Mali" },
  NE: { flag: "🇳🇪", name: "Niger" },
  CM: { flag: "🇨🇲", name: "Cameroun" },
  GA: { flag: "🇬🇦", name: "Gabon" },
  CG: { flag: "🇨🇬", name: "Congo" },
  GH: { flag: "🇬🇭", name: "Ghana" },
  NG: { flag: "🇳🇬", name: "Nigeria" },
};

/**
 * Fetches all wallets of a merchant for a given mode and formats them
 * as a Telegram-ready string showing the balance per country.
 */
export async function buildWalletsSummary(userId: number, mode: string): Promise<string> {
  try {
    const wallets = await db
      .select({
        countryCode: walletsTable.countryCode,
        currency: walletsTable.currency,
        balance: walletsTable.balance,
      })
      .from(walletsTable)
      .where(and(eq(walletsTable.userId, userId), eq(walletsTable.mode, mode as "sandbox" | "live")));

    if (!wallets.length) return "";

    const lines = wallets.map(w => {
      const meta = COUNTRY_META[w.countryCode.toUpperCase()] ?? { flag: "🌍", name: w.countryCode };
      const bal = parseFloat(String(w.balance));
      return `  ${meta.flag} ${meta.name} — <b>${bal.toLocaleString("fr-FR")} ${w.currency}</b>`;
    });

    return `\n\n💼 <b>Soldes actuels :</b>\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

// ─── Config cache ──────────────────────────────────────────────────────────────
interface TGConfig { token: string; chatId: string }
let _cache: (TGConfig & { at: number }) | null = null;
const CACHE_TTL = 30_000;

export function invalidateTelegramCache() { _cache = null; }

async function getConfig(): Promise<TGConfig | null> {
  const now = Date.now();
  if (_cache && now - _cache.at < CACHE_TTL) return _cache;
  try {
    const rows = await db.select().from(adminSettingsTable);
    const map = Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
    const token = map["telegram_bot_token"] ?? "";
    const chatId = map["telegram_chat_id"] ?? "";
    if (!token || !chatId) return null;
    _cache = { token, chatId, at: now };
    return _cache;
  } catch {
    return null;
  }
}

// ─── Africa country codes ──────────────────────────────────────────────────────
const AFRICA_CODES = new Set([
  "DZ","AO","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","CI","DJ",
  "EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG",
  "MW","ML","MR","MU","MA","MZ","NA","NE","NG","RW","ST","SN","SC","SL","SO",
  "ZA","SS","SD","TZ","TG","TN","UG","ZM","ZW",
]);

// ─── Core send ─────────────────────────────────────────────────────────────────
export async function sendTo(token: string, chatId: string, text: string) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!r.ok) console.error("[Telegram] send failed:", await r.text());
  } catch (e) {
    console.error("[Telegram] send error:", e);
  }
}

async function send(text: string) {
  const cfg = await getConfig();
  if (!cfg) return;
  await sendTo(cfg.token, cfg.chatId, text);
}

// Send with inline keyboard buttons [[{text, callback_data}]]
async function sendWithButtons(text: string, buttons: Array<Array<{ text: string; callback_data: string }>>) {
  const cfg = await getConfig();
  if (!cfg) return;
  try {
    const r = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: buttons },
      }),
    });
    if (!r.ok) console.error("[Telegram] sendWithButtons failed:", await r.text());
  } catch (e) {
    console.error("[Telegram] sendWithButtons error:", e);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function dt(d: Date = new Date()) {
  return d.toLocaleString("fr-FR", { timeZone: "Africa/Lome", hour12: false }).replace(",", "");
}
function money(n: number, cur = "FCFA") {
  return `${n.toLocaleString("fr-FR")} ${cur}`;
}

const LARGE = 500_000;

// ─── Event notifications ───────────────────────────────────────────────────────
export async function notifyContactForm(opts: {
  name: string; email: string; company?: string; subject: string; message: string;
}) {
  await send(
`📬 <b>Nouveau Message — Formulaire Contact</b>

👤 Nom: ${opts.name}
📧 Email: ${opts.email}${opts.company ? `\n🏢 Entreprise: ${opts.company}` : ""}
📌 Sujet: ${opts.subject}

💬 Message:
${opts.message}

📅 ${dt()}`
  );
}

export async function notifyNewUser(email: string, company: string, country: string) {
  await send(
`👤 <b>Nouveau Marchand</b>

🏢 ${company}
📧 ${email}
🌍 Pays: ${country}
📅 ${dt()}`
  );
}

// ─── Login attempt notification (merchant + admin) ─────────────────────────────
export async function notifyLoginAttempt(opts: {
  type: "success" | "failed" | "new_device";
  email: string;
  role: "merchant" | "admin";
  ip: string;
  country?: string | null;
  isVpn?: boolean;
  isHosting?: boolean;
  org?: string;
  userId?: number;
}) {
  const icons: Record<string, string> = {
    success: opts.role === "admin" ? "🔐" : "✅",
    failed: "❌",
    new_device: "📱",
  };
  const roleLabel = opts.role === "admin" ? "Admin" : "Marchand";
  const statusLabel = opts.type === "success" ? "Réussie" : opts.type === "failed" ? "Échouée" : "Nouvel appareil";
  const country = opts.country ?? "—";
  const isAfrica = opts.country ? AFRICA_CODES.has(opts.country) : true;

  const warnings: string[] = [];
  if (opts.isVpn) warnings.push("⚠️ <b>VPN / Proxy détecté !</b>");
  if (opts.isHosting) warnings.push(`🖥️ <b>Hébergement suspect :</b> ${opts.org ?? "inconnu"}`);
  if (!isAfrica && opts.country) warnings.push(`🌍 <b>Connexion hors Afrique !</b> (${opts.country})`);

  const warningBlock = warnings.length > 0 ? "\n" + warnings.join("\n") : "";

  const text =
`${icons[opts.type] ?? "🔔"} <b>Connexion ${roleLabel} — ${statusLabel}</b>
📧 ${opts.email}
🌐 IP: <code>${opts.ip}</code>
🏳️ Pays: ${country}${warningBlock}
📅 ${dt()}`;

  const buttons: Array<Array<{ text: string; callback_data: string }>> = [
    [{ text: "🚫 Bloquer cette IP", callback_data: `block_ip:${opts.ip}` }],
  ];

  await sendWithButtons(text, buttons);
}

export async function notifyPayin(opts: {
  company: string; amount: number; fee: number; net: number;
  currency: string; operator: string; phone: string;
  country: string; reference: string; mode: string; source: "api" | "link" | "qr";
  walletsSummary?: string;
}) {
  const large = opts.amount >= LARGE;
  const src = opts.source === "api" ? "API" : opts.source === "qr" ? "QR" : "Lien";
  const header = large
    ? `🚨 <b>GROS MONTANT — Paiement Initié (${src})</b>`
    : `⏳ <b>Paiement Initié (${src})</b>`;
  await send(
`${header}

🏢 ${opts.company}
💵 Montant: <b>${money(opts.amount, opts.currency)}</b>
   Frais: ${money(opts.fee, opts.currency)} | Net: ${money(opts.net, opts.currency)}
📱 ${opts.operator} → ${opts.phone}
🌍 ${opts.country}
🔖 <code>${opts.reference}</code>
${opts.mode === "live" ? "🟢 LIVE" : "🔵 SANDBOX"}
📅 ${dt()}${opts.walletsSummary ?? ""}`
  );
}

export async function notifyPayinConfirmed(opts: {
  company: string; amount: number; fee: number; net: number;
  currency: string; operator: string; phone: string;
  country: string; reference: string; mode: string; source: "api" | "link" | "qr";
  gateway: string; walletsSummary?: string;
}) {
  const large = opts.amount >= LARGE;
  const src = opts.source === "api" ? "API" : opts.source === "qr" ? "QR" : "Lien";
  const header = large
    ? `🚨 <b>GROS MONTANT — Paiement Confirmé (${src})</b>`
    : `💰 <b>Paiement Confirmé (${src})</b>`;
  await send(
`${header}

🏢 ${opts.company}
💵 Montant: <b>${money(opts.amount, opts.currency)}</b>
   Frais: ${money(opts.fee, opts.currency)} | Net: ${money(opts.net, opts.currency)}
📱 ${opts.operator} → ${opts.phone}
🌍 ${opts.country}
🔖 <code>${opts.reference}</code>
🔗 Gateway: ${opts.gateway}
${opts.mode === "live" ? "🟢 LIVE" : "🔵 SANDBOX"}
📅 ${dt()}${opts.walletsSummary ?? ""}`
  );
}

export async function notifyKybSubmitted(opts: { company: string; email: string; country: string; id: number }) {
  await send(
`📋 <b>KYB Soumis</b>

🏢 ${opts.company}
📧 ${opts.email}
🌍 ${opts.country}
🔖 Dossier #${opts.id}
📅 ${dt()}`
  );
}

export async function notifyKybDecision(opts: {
  company: string; email: string;
  decision: "approved" | "rejected"; reason?: string; adminEmail: string;
}) {
  const ok = opts.decision === "approved";
  let text = `${ok ? "✅" : "❌"} <b>KYB ${ok ? "Approuvé" : "Rejeté"}</b>\n\n🏢 ${opts.company}\n📧 ${opts.email}\n👤 Par: ${opts.adminEmail}\n📅 ${dt()}`;
  if (!ok && opts.reason) text += `\n📝 Raison: ${opts.reason}`;
  await send(text);
}

export async function notifyReversement(opts: {
  company: string; amount: number; currency: string;
  operator: string; phone: string; country: string; mode: string;
  walletsSummary?: string;
}) {
  await send(
`💸 <b>Demande de Retrait</b>

🏢 ${opts.company}
💵 Montant: <b>${money(opts.amount, opts.currency)}</b>
📱 ${opts.operator} → ${opts.phone}
🌍 ${opts.country}
${opts.mode === "live" ? "🟢 LIVE" : "🔵 SANDBOX"}
📅 ${dt()}${opts.walletsSummary ?? ""}`
  );
}

export async function notifyWalletExchange(opts: {
  id: number;
  company: string; amount: number; fee: number; net: number;
  currency: string; fromCountry: string; toCountry: string; mode: string; reference: string;
}) {
  const text =
`🔄 <b>Nouvelle Demande d'Échange Wallet</b>

🏢 ${opts.company}
🌍 ${opts.fromCountry} → ${opts.toCountry}
💵 Montant: <b>${money(opts.amount, opts.currency)}</b>
   Frais (3%): ${money(opts.fee, opts.currency)} | Net crédité: ${money(opts.net, opts.currency)}
🔖 <code>${opts.reference}</code>
${opts.mode === "live" ? "🟢 LIVE" : "🔵 SANDBOX"}
📅 ${dt()}`;

  await sendWithButtons(text, [
    [
      { text: "✅ Approuver", callback_data: `approve_exchange:${opts.id}` },
      { text: "❌ Rejeter", callback_data: `reject_exchange:${opts.id}` },
    ],
  ]);
}

export async function notifyTransactionFailure(opts: {
  type: "payin" | "payout";
  company: string;
  amount: number;
  currency: string;
  operator: string;
  phone: string;
  country: string;
  reference: string;
  gateway: string;
  reason: string;
  mode: string;
}) {
  const label = opts.type === "payin" ? "Paiement" : "Retrait";
  await send(
`❌ <b>Échec ${label}</b>

🏢 ${opts.company}
💵 Montant: <b>${money(opts.amount, opts.currency)}</b>
📱 ${opts.operator} → ${opts.phone}
🌍 ${opts.country}
🔖 <code>${opts.reference}</code>
🔗 Gateway: ${opts.gateway}
📝 Raison réelle: ${opts.reason}
${opts.mode === "live" ? "🟢 LIVE" : "🔵 SANDBOX"}
📅 ${dt()}`
  );
}

export async function notifyBlacklist(action: "added" | "removed", phone: string, reason?: string, adminEmail?: string) {
  const icon = action === "added" ? "🚫" : "✅";
  const label = action === "added" ? "Numéro Bloqué" : "Numéro Débloqué";
  let text = `${icon} <b>${label}</b>\n\n📱 ${phone}\n👤 Admin: ${adminEmail ?? "?"}\n📅 ${dt()}`;
  if (action === "added" && reason) text += `\n📝 Raison: ${reason}`;
  await send(text);
}

export async function notifyCriticalError(context: string, err: string) {
  await send(
`🆘 <b>Erreur Système Critique</b>

📍 ${context}
❌ ${err.substring(0, 300)}
📅 ${dt()}`
  );
}

// ─── Daily report (midnight Lomé = midnight UTC) ───────────────────────────────
export async function sendDailyReport() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [newUsers] = await db.select({ c: count() }).from(usersTable)
      .where(and(gte(usersTable.createdAt, today), lt(usersTable.createdAt, tomorrow)));

    const txRows = await db.select({
      status: transactionsTable.status,
      cnt: count(),
      vol: sum(transactionsTable.amount),
    }).from(transactionsTable)
      .where(and(gte(transactionsTable.createdAt, today), lt(transactionsTable.createdAt, tomorrow)));

    const success = txRows.find(r => r.status === "success");
    const failed  = txRows.find(r => r.status === "failed");
    const volume  = Number(success?.vol ?? 0);

    await send(
`📊 <b>Rapport Quotidien DrimPay</b>
📅 ${today.toLocaleDateString("fr-FR")}

👤 Nouveaux marchands: <b>${newUsers.c}</b>
✅ Pay-ins réussis: <b>${success?.cnt ?? 0}</b> (${money(volume)})
❌ Pay-ins échoués: <b>${failed?.cnt ?? 0}</b>
💰 Volume total: <b>${money(volume)}</b>`
    );
  } catch (e) {
    console.error("[Telegram] Daily report error:", e);
  }
}

export function startDailyReport() {
  const schedule = () => {
    const nextMidnight = new Date();
    nextMidnight.setUTCHours(24, 0, 0, 0);
    const delay = nextMidnight.getTime() - Date.now();
    setTimeout(async () => { await sendDailyReport(); schedule(); }, delay);
  };
  schedule();
  console.log("[Telegram] Daily report scheduler started (midnight UTC/Lomé)");
}

// ─── Bot command polling ───────────────────────────────────────────────────────
let _lastId = 0;

async function handleCommand(token: string, chatId: string, text: string) {
  const cmd = text.split("@")[0].toLowerCase().trim();

  if (cmd === "/stats") {
    const [merchants] = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.role, "user"));
    const [txAll] = await db.select({ c: count(), v: sum(transactionsTable.amount) })
      .from(transactionsTable).where(eq(transactionsTable.status, "success"));
    // Check payout status
    const [payoutSetting] = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "payouts_enabled")).limit(1);
    const payoutsEnabled = payoutSetting?.value !== "false";
    await sendTo(token, chatId,
`📊 <b>Stats DrimPay</b>

👥 Marchands: <b>${merchants.c}</b>
✅ Transactions réussies: <b>${txAll.c}</b>
💰 Volume total: <b>${money(Number(txAll.v ?? 0))}</b>
💸 Retraits: ${payoutsEnabled ? "🟢 Activés" : "🔴 <b>DÉSACTIVÉS</b>"}
📅 ${dt()}`
    );
  } else if (cmd === "/ip") {
    let ip = "Inconnue";
    try { const r = await fetch("https://api.ipify.org?format=json"); const d = await r.json() as any; ip = d.ip; } catch {}
    await sendTo(token, chatId, `🌐 <b>IP Serveur</b>\n\n📍 ${ip}\n📅 ${dt()}`);
  } else if (cmd === "/stopretraits") {
    try {
      await db.insert(adminSettingsTable).values({ key: "payouts_enabled", value: "false" })
        .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: "false" } });
      await sendTo(token, chatId,
`🔴 <b>Retraits DÉSACTIVÉS</b>

Tous les pay-outs sont bloqués instantanément sur la plateforme.
Aucun marchand ne peut initier de retrait.

Utilisez /activetraits pour réactiver.
📅 ${dt()}`
      );
    } catch (e) {
      await sendTo(token, chatId, `❌ Erreur lors de la désactivation des retraits: ${String(e).substring(0, 200)}`);
    }
  } else if (cmd === "/activetraits") {
    try {
      await db.insert(adminSettingsTable).values({ key: "payouts_enabled", value: "true" })
        .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: "true" } });
      await sendTo(token, chatId,
`🟢 <b>Retraits RÉACTIVÉS</b>

Les pay-outs sont à nouveau disponibles pour tous les marchands.
📅 ${dt()}`
      );
    } catch (e) {
      await sendTo(token, chatId, `❌ Erreur lors de la réactivation des retraits: ${String(e).substring(0, 200)}`);
    }
  } else if (cmd === "/blocked") {
    try {
      const rows = await db
        .select({ ip: blockedIpsTable.ip, reason: blockedIpsTable.reason, createdAt: blockedIpsTable.createdAt })
        .from(blockedIpsTable)
        .orderBy(blockedIpsTable.createdAt)
        .limit(20);
      if (rows.length === 0) {
        await sendTo(token, chatId, "✅ Aucune IP bloquée actuellement.");
        return;
      }
      const lines = rows.map(r =>
        `• <code>${r.ip}</code> — ${r.reason?.substring(0, 60) ?? "—"}`
      ).join("\n");
      await sendTo(token, chatId,
`🚫 <b>IPs Bloquées (${rows.length})</b>

${lines}

📅 ${dt()}`
      );
    } catch (e) {
      await sendTo(token, chatId, `❌ Erreur: ${String(e).substring(0, 200)}`);
    }

  } else if (cmd === "/echanges") {
    try {
      const rows = await db
        .select()
        .from(walletExchangesTable)
        .where(eq(walletExchangesTable.status, "pending"))
        .orderBy(desc(walletExchangesTable.createdAt))
        .limit(10);

      if (rows.length === 0) {
        await sendTo(token, chatId, "✅ Aucun échange de wallet en attente.");
        return;
      }

      const userIds = [...new Set(rows.map(r => r.userId))];
      const users = await db.select({ id: usersTable.id, companyName: usersTable.companyName }).from(usersTable);
      const userMap = Object.fromEntries(users.filter(u => userIds.includes(u.id)).map(u => [u.id, u.companyName]));

      await sendTo(token, chatId, `🔄 <b>Échanges en attente (${rows.length})</b>\n📅 ${dt()}`);

      for (const r of rows) {
        const text =
`🏢 ${userMap[r.userId] ?? "?"}
🌍 ${r.fromCountryCode} → ${r.toCountryCode}
💵 Montant: <b>${money(parseFloat(r.amount as string), r.currency)}</b>
   Frais: ${money(parseFloat(r.fee as string), r.currency)} | Net: ${money(parseFloat(r.netAmount as string), r.currency)}
🔖 <code>${r.reference}</code>
${r.mode === "live" ? "🟢 LIVE" : "🔵 SANDBOX"}`;
        await sendWithButtons(text, [
          [
            { text: "✅ Approuver", callback_data: `approve_exchange:${r.id}` },
            { text: "❌ Rejeter", callback_data: `reject_exchange:${r.id}` },
          ],
        ]);
      }
    } catch (e) {
      await sendTo(token, chatId, `❌ Erreur: ${String(e).substring(0, 200)}`);
    }

  } else if (cmd === "/help") {
    await sendTo(token, chatId,
`🤖 <b>DrimPay Bot — Aide</b>

<b>Commandes :</b>
/stats — Statistiques + état des retraits
/ip — Adresse IP du serveur
/blocked — 🚫 Lister les IPs bloquées (20 dernières)
/echanges — 🔄 Lister les échanges de wallet en attente
/stopretraits — 🔴 Bloquer TOUS les retraits instantanément
/activetraits — 🟢 Réactiver les retraits
/help — Afficher cette aide

<b>Alertes automatiques :</b>
🚨 Intrusion panel admin (hors Togo/VPN/hosting) → auto-bloqué
✅❌📱 Toutes les tentatives de connexion (marchands + admin)
⚠️ VPN / Proxy / Hébergement suspect
🌍 Connexion hors Afrique
🚫 Bouton bloquer IP (inline) + 🔓 Débloquer
👤 Nouveaux marchands
💰 Paiements reçus (API &amp; liens)
🚨 Gros montants (≥500 000 FCFA)
💸 Demandes de retrait
🔄 Demandes d'échange de wallet (+ boutons Approuver/Rejeter)
📋 KYB soumis / traités
🆘 Erreurs critiques
📊 Rapport quotidien (minuit Lomé)`
    );
  }
}

// ─── Callback query handler (inline button presses) ────────────────────────────
async function handleCallback(token: string, callbackId: string, chatId: string, data: string, fromName: string) {
  // Acknowledge the callback immediately
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId, text: "Traitement en cours..." }),
    });
  } catch { /* ignore */ }

  if (data.startsWith("block_ip:")) {
    const ip = data.slice(9).trim();
    if (!ip) { await sendTo(token, chatId, "❌ IP invalide."); return; }
    try {
      await db.insert(blockedIpsTable).values({
        ip,
        reason: `Bloqué via Telegram par ${fromName}`,
        permanent: true,
      }).onConflictDoNothing();
      await sendTo(token, chatId,
`🚫 <b>IP Bloquée</b>

<code>${ip}</code> est désormais bloquée définitivement.
👤 Par: ${fromName}
📅 ${dt()}`
      );
    } catch (e) {
      await sendTo(token, chatId, `❌ Erreur blocage <code>${ip}</code>: ${String(e).substring(0, 200)}`);
    }

  } else if (data.startsWith("approve_exchange:")) {
    const id = parseInt(data.slice(17), 10);
    if (isNaN(id)) { await sendTo(token, chatId, "❌ Référence invalide."); return; }
    const result = await approveWalletExchange(id, `Telegram: ${fromName}`);
    if (result.ok) {
      await sendTo(token, chatId, `✅ <b>Échange #${id} approuvé</b>\n👤 Par: ${fromName}\n📅 ${dt()}`);
    } else {
      await sendTo(token, chatId, `❌ Échec approbation #${id}: ${result.error}`);
    }

  } else if (data.startsWith("reject_exchange:")) {
    const id = parseInt(data.slice(16), 10);
    if (isNaN(id)) { await sendTo(token, chatId, "❌ Référence invalide."); return; }
    const result = await rejectWalletExchange(id, `Rejeté via Telegram par ${fromName}`, `Telegram: ${fromName}`);
    if (result.ok) {
      await sendTo(token, chatId, `❌ <b>Échange #${id} rejeté</b>\n👤 Par: ${fromName}\n📅 ${dt()}`);
    } else {
      await sendTo(token, chatId, `❌ Échec rejet #${id}: ${result.error}`);
    }

  } else if (data === "disable_payouts:1") {
    try {
      await db.insert(adminSettingsTable).values({ key: "payouts_enabled", value: "false" })
        .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: "false", updatedAt: new Date() } });
      await sendTo(token, chatId,
`🔴 <b>Retraits DÉSACTIVÉS</b>

Tous les pay-outs sont bloqués instantanément.
👤 Par: ${fromName}
📅 ${dt()}

Utilisez /activetraits pour réactiver.`
      );
    } catch (e) {
      await sendTo(token, chatId, `❌ Erreur: ${String(e).substring(0, 200)}`);
    }

  } else if (data === "enable_payouts:1") {
    try {
      await db.insert(adminSettingsTable).values({ key: "payouts_enabled", value: "true" })
        .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: "true", updatedAt: new Date() } });
      await sendTo(token, chatId,
`🟢 <b>Retraits RÉACTIVÉS</b>

Les pay-outs sont à nouveau disponibles.
👤 Par: ${fromName}
📅 ${dt()}`
      );
    } catch (e) {
      await sendTo(token, chatId, `❌ Erreur: ${String(e).substring(0, 200)}`);
    }

  } else if (data.startsWith("unblock_ip:")) {
    // Débloquer une IP auto-bloquée (ex: faux positif admin légitime)
    const ip = data.slice(11).trim();
    if (!ip) { await sendTo(token, chatId, "❌ IP invalide."); return; }
    try {
      await db.delete(blockedIpsTable).where(eq(blockedIpsTable.ip, ip));
      await sendTo(token, chatId,
`🔓 <b>IP Débloquée</b>

<code>${ip}</code> a été retirée de la liste noire.
👤 Par: ${fromName}
📅 ${dt()}

⚠️ Si cette IP était malveillante, utilisez /blocked pour vérifier.`
      );
    } catch (e) {
      await sendTo(token, chatId, `❌ Erreur déblocage <code>${ip}</code>: ${String(e).substring(0, 200)}`);
    }
  }
}

export function startPolling() {
  const poll = async () => {
    const cfg = await getConfig();
    if (!cfg) { setTimeout(poll, 15_000); return; }
    try {
      const r = await fetch(
        `https://api.telegram.org/bot${cfg.token}/getUpdates?offset=${_lastId + 1}&timeout=20&allowed_updates=["message","channel_post","callback_query"]`,
        { signal: AbortSignal.timeout(25_000) }
      );
      if (!r.ok) { setTimeout(poll, 5_000); return; }
      const data = await r.json() as any;
      if (!data.ok) {
        if (data.error_code === 409) {
          console.warn("[Telegram] Webhook conflict detected, deleting webhook...");
          await fetch(`https://api.telegram.org/bot${cfg.token}/deleteWebhook?drop_pending_updates=false`);
        }
        setTimeout(poll, 5_000);
        return;
      }
      for (const u of data.result as any[]) {
        _lastId = u.update_id;
        if (u.callback_query) {
          const cq = u.callback_query;
          const replyTo = String(cq.message?.chat?.id ?? cfg.chatId);
          const fromName = cq.from?.username
            ? `@${cq.from.username}`
            : `${cq.from?.first_name ?? "Admin"} ${cq.from?.last_name ?? ""}`.trim();
          await handleCallback(cfg.token, cq.id, replyTo, cq.data ?? "", fromName);
        } else {
          const msg = u.message ?? u.channel_post;
          if (msg?.text?.startsWith("/")) {
            const replyTo = String(msg.chat.id);
            await handleCommand(cfg.token, replyTo, msg.text.trim());
          }
        }
      }
      setTimeout(poll, data.result.length ? 100 : 1_000);
    } catch {
      setTimeout(poll, 5_000);
    }
  };

  // Delete any existing webhook before starting long-poll
  // (a registered webhook prevents getUpdates from receiving messages)
  getConfig().then(cfg => {
    if (!cfg) { poll(); return; }
    fetch(`https://api.telegram.org/bot${cfg.token}/deleteWebhook?drop_pending_updates=false`)
      .then(r => r.json())
      .then((d: any) => {
        if (d.ok) console.log("[Telegram] Webhook supprimé — long-polling actif");
        else console.warn("[Telegram] deleteWebhook:", d.description);
      })
      .catch(() => {})
      .finally(() => poll());
  }).catch(() => poll());

  console.log("[Telegram] Command polling starting...");
}

// ─── Spam / surcharge detection ───────────────────────────────────────────────
// key = `${merchantId}:${source}`, value = timestamp of last notification
const _spamCooldown = new Map<string, number>();
const SPAM_COOLDOWN_MS = 30 * 60 * 1000; // 30 min between repeated alerts

/**
 * Notify admins when a merchant triggers too many payment attempts.
 * Deduplicates: only one alert per merchant per source every 30 minutes.
 */
// ─── Admin intrusion alert (non-TG / VPN / hosting → auto-blocked) ────────────
export async function notifyAdminIntrusion(opts: {
  ip: string;
  country: string;
  isVpn: boolean;
  isHosting: boolean;
  org: string;
  method: string;
  path: string;
  ua: string;
  reason: string;
}) {
  const flags: string[] = [];
  if (opts.isVpn)     flags.push(`⚠️ <b>VPN / Proxy</b> — ${opts.org}`);
  if (opts.isHosting) flags.push(`🖥️ <b>Hébergement</b> — ${opts.org}`);
  if (!opts.isVpn && !opts.isHosting) flags.push(`🌍 <b>Pays bloqué :</b> ${opts.country}`);

  const text =
`🚨 <b>INTRUSION PANEL ADMIN — AUTO-BLOQUÉE</b>

🌐 IP: <code>${opts.ip}</code>
🏳️ Pays: ${opts.country}
${flags.join("\n")}
📍 Route: <code>${opts.method} ${opts.path}</code>
📝 Raison: ${opts.reason}

✅ <b>IP bloquée définitivement en base.</b>
📅 ${dt()}`;

  await sendWithButtons(text, [
    [{ text: "🔓 Débloquer (si légitime)", callback_data: `unblock_ip:${opts.ip}` }],
  ]);
}

export async function notifyAttemptSpam(opts: {
  merchantId: number;
  company: string;
  email: string;
  count: number;
  windowMinutes: number;
  source: "link" | "api";
}) {
  const key = `${opts.merchantId}:${opts.source}`;
  const now = Date.now();
  const last = _spamCooldown.get(key) ?? 0;
  if (now - last < SPAM_COOLDOWN_MS) return; // already alerted recently
  _spamCooldown.set(key, now);

  const srcLabel = opts.source === "api" ? "API Pay-in" : "Lien de paiement";
  await send(
`⚠️ <b>ALERTE SURCHARGE — ${srcLabel}</b>

Un marchand a déclenché <b>${opts.count} tentatives</b> en ${opts.windowMinutes} min.

🏢 ${opts.company}
📧 ${opts.email}
🔖 ID: <code>${opts.merchantId}</code>
📊 Source: ${srcLabel}
🕒 Fenêtre: ${opts.windowMinutes} dernières minutes

Vérifiez l'activité de ce marchand — possible abus ou test automatisé.
📅 ${dt()}`
  );
}

// ─── Admin action notifications ───────────────────────────────────────────────
const ACTION_META: Record<string, { icon: string; label: string }> = {
  CREDIT_WALLET:        { icon: "💰", label: "Wallet Crédité" },
  DEBIT_WALLET:         { icon: "💸", label: "Wallet Débité" },
  EDIT_WALLET_BALANCE:  { icon: "✏️",  label: "Solde Wallet Modifié" },
  SUSPEND_MERCHANT:     { icon: "🔴", label: "Marchand Suspendu" },
  ACTIVATE_MERCHANT:    { icon: "✅", label: "Marchand Activé" },
  DELETE_MERCHANT:      { icon: "🗑️",  label: "Marchand Supprimé" },
  RESET_PASSWORD:       { icon: "🔑", label: "Mot de Passe Réinitialisé" },
  PROMOTE_ADMIN:        { icon: "👑", label: "Promu Administrateur" },
  DEMOTE_ADMIN:         { icon: "🔽", label: "Rétrogradé Marchand" },
  RESET_STATS:          { icon: "🔄", label: "Statistiques Réinitialisées" },
  UPDATE_MERCHANT:      { icon: "📝", label: "Profil Marchand Modifié" },
  GRANT_SUPPORT_AGENT:  { icon: "🤝", label: "Agent Support Activé" },
  REVOKE_SUPPORT_AGENT: { icon: "❌", label: "Agent Support Révoqué" },
};

export async function notifyAdminAction(opts: {
  action: string;
  adminEmail: string;
  targetLabel: string;
  details?: string;
  mode?: string;
  buttons?: Array<Array<{ text: string; callback_data: string }>>;
}) {
  const meta = ACTION_META[opts.action] ?? { icon: "🔔", label: opts.action };
  const modeTag = opts.mode === "live" ? "\n🟢 LIVE" : opts.mode === "sandbox" ? "\n🔵 SANDBOX" : "";

  const text =
`${meta.icon} <b>Action Admin — ${meta.label}</b>

👤 Admin: ${opts.adminEmail}
🎯 Cible: ${opts.targetLabel}${opts.details ? `\n📝 ${opts.details}` : ""}${modeTag}
📅 ${dt()}`;

  const defaultButtons: Array<Array<{ text: string; callback_data: string }>> = [
    [{ text: "🛑 Stopper tous les retraits", callback_data: "disable_payouts:1" }],
  ];
  await sendWithButtons(text, opts.buttons ?? defaultButtons);
}

// ─── Admin helpers (called from admin routes) ──────────────────────────────────
export async function testConnection(token: string, chatId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ <b>Connexion DrimPay réussie !</b>\n\nLe bot est correctement configuré.\n📅 ${dt()}`,
        parse_mode: "HTML",
      }),
    });
    const d = await r.json() as any;
    if (!d.ok) return { ok: false, error: d.description };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function detectChatId(token: string): Promise<{ ok: boolean; chatId?: string; title?: string; error?: string }> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100`);
    const d = await r.json() as any;
    if (!d.ok) return { ok: false, error: d.description };
    for (const u of [...d.result].reverse()) {
      const chat = (u.message ?? u.channel_post)?.chat;
      if (chat && (chat.type === "group" || chat.type === "supergroup" || chat.type === "channel")) {
        return { ok: true, chatId: String(chat.id), title: chat.title };
      }
    }
    return { ok: false, error: "Aucun groupe détecté. Envoyez un message dans le groupe et réessayez." };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
