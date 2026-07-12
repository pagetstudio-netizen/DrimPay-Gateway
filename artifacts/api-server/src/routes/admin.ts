import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  usersTable, transactionsTable, walletsTable, kybSubmissionsTable,
  apiKeysTable, paymentLinksTable, operatorsTable, countriesTable,
  aggregatorsTable, operatorAggregatorsTable, adminLogsTable, adminSettingsTable,
  blacklistedPhonesTable, paymentLinkAttemptsTable, socialLinksTable,
  notificationsTable, supportUsersTable, globalBannersTable,
  userWebhooksTable, userAllowedIpsTable, jobsTable, walletExchangesTable,
  reversementsTable, virtualCardOrdersTable, massPayoutJobsTable,
  passwordResetTokensTable, emailVerificationTokensTable, knownDevicesTable,
} from "@workspace/db/schema";
import { eq, and, asc, desc, sum, count, sql, ilike, or, gte, lt, inArray } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { downloadKybDocument, downloadContractTemplate, uploadContractTemplateBuffer, getContractTemplateInfo, uploadBannerImage } from "../lib/storage";
import multer from "multer";
import {
  notifyKybDecision, notifyBlacklist,
  testConnection, detectChatId, invalidateTelegramCache,
  notifyLoginAttempt,
} from "../lib/telegram";
import { logSecurityEvent, getClientIp } from "../middlewares/security";

import { generateContractPdf } from "../lib/contract-pdf";
import { sendBroadcastEmail, sendKybApprovedEmail, sendKybRejectedEmail } from "../lib/mailer";
import { settlePayinStatus } from "../lib/payin-settlement";
import { resolveAggregator } from "../lib/aggregator-router";
import { approveWalletExchange, rejectWalletExchange } from "../lib/wallet-exchange-service";

const contractUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      || file.originalname.endsWith(".docx");
    cb(null, ok);
  },
});

const router = Router();

// Secret admin route prefix — configurable via ADMIN_ROUTE_SECRET env var
const AP = `/${process.env["ADMIN_ROUTE_SECRET"] ?? "admin"}`;

// In-memory counter for unauthorized admin probe attempts (resets on restart)
const _adminProbeCounter = new Map<string, { count: number; lastAlert: number }>();
const PROBE_ALERT_THRESHOLD = 3;    // alert after N unauthorized attempts
const PROBE_ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 min between repeated alerts

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    const ip = getClientIp(req);
    // Log + count unauthorized admin probes
    logSecurityEvent({ eventType: "SUSPICIOUS_ACTIVITY", req, details: `Admin probe sans session — ${req.method} ${req.path}`, riskLevel: "high" }).catch(() => {});
    const now = Date.now();
    const entry = _adminProbeCounter.get(ip) ?? { count: 0, lastAlert: 0 };
    entry.count++;
    _adminProbeCounter.set(ip, entry);
    if (entry.count >= PROBE_ALERT_THRESHOLD && now - entry.lastAlert > PROBE_ALERT_COOLDOWN_MS) {
      entry.lastAlert = now;
      notifyLoginAttempt({
        type: "failed",
        email: `Inconnu (${entry.count} tentatives admin)`,
        role: "admin",
        ip,
        userId: undefined,
      }).catch(() => {});
    }
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.session?.role !== "admin") {
    const ip = getClientIp(req);
    logSecurityEvent({ eventType: "SUSPICIOUS_ACTIVITY", req, userId: req.session.userId, details: `Accès admin refusé — rôle: ${req.session.role} — ${req.method} ${req.path}`, riskLevel: "high" }).catch(() => {});
    notifyLoginAttempt({
      type: "failed",
      email: `UserID ${req.session.userId} (pas admin)`,
      role: "merchant",
      ip,
      userId: req.session.userId,
    }).catch(() => {});
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

async function logAdminAction(adminId: number, action: string, targetType?: string, targetId?: string, details?: string, ip?: string) {
  try {
    await db.insert(adminLogsTable).values({ adminId, action, targetType, targetId, details, ipAddress: ip });
  } catch {}
}

// ─── STATS ───────────────────────────────────────────────────────────────────
router.get(AP + "/stats", requireAdmin, async (req: any, res: any) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Read stats reset date and balance snapshot from admin settings
  const adminSettings = await db
    .select({ key: adminSettingsTable.key, value: adminSettingsTable.value })
    .from(adminSettingsTable)
    .where(sql`${adminSettingsTable.key} IN ('stats_reset_at', 'platform_balance_at_reset')`);
  const settingsMap = Object.fromEntries(adminSettings.map(s => [s.key, s.value]));
  const statsResetAt = settingsMap["stats_reset_at"] ? new Date(settingsMap["stats_reset_at"]) : null;
  const balanceAtReset = parseFloat(settingsMap["platform_balance_at_reset"] ?? "0");

  // Build base condition for transaction stats (filtered from reset date if set)
  const txLiveBase = statsResetAt
    ? and(eq(transactionsTable.mode, "live"), gte(transactionsTable.createdAt, statsResetAt))
    : eq(transactionsTable.mode, "live");

  // Run all independent queries in parallel
  const [
    [totalMerchants],
    [totalUsers],
    [kybApproved],
    [kybPending],
    [kybUnderReview],
    [activeApiKeys],
    [totalApiKeys],
    [activeWallets],
    [totalWallets],
    [totalLinks],
    [activeLinks],
    soldePlateforme,
    txToday,
    txAll,
    bigTxAlerts,
    recentTx,
    domainesRaw,
    [exchangeApproved],
    [exchangePending],
  ] = await Promise.all([
    db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "user")),
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.status, "approved")),
    db.select({ count: count() }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.status, "submitted")),
    db.select({ count: count() }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.status, "under_review")),
    db.select({ count: count() }).from(apiKeysTable).where(eq(apiKeysTable.status, "active")),
    db.select({ count: count() }).from(apiKeysTable),
    db.select({ count: count() }).from(walletsTable).where(eq(walletsTable.active, true)),
    db.select({ count: count() }).from(walletsTable),
    db.select({ count: count() }).from(paymentLinksTable),
    db.select({ count: count() }).from(paymentLinksTable).where(eq(paymentLinksTable.status, "active")),
    db.select({ total: sum(walletsTable.balance) }).from(walletsTable),
    db.select({
      type: transactionsTable.type,
      total: sum(transactionsTable.amount),
      fees: sum(transactionsTable.fee),
      cnt: count(),
    }).from(transactionsTable)
      .where(and(gte(transactionsTable.createdAt, today), lt(transactionsTable.createdAt, tomorrow), eq(transactionsTable.mode, "live"), eq(transactionsTable.status, "success")))
      .groupBy(transactionsTable.type),
    db.select({
      type: transactionsTable.type,
      status: transactionsTable.status,
      mode: transactionsTable.mode,
      total: sum(transactionsTable.amount),
      fees: sum(transactionsTable.fee),
      cnt: count(),
    }).from(transactionsTable).where(txLiveBase).groupBy(transactionsTable.type, transactionsTable.status, transactionsTable.mode),
    db.select().from(transactionsTable)
      .where(and(sql`${transactionsTable.amount}::numeric > 60000`, txLiveBase))
      .orderBy(desc(transactionsTable.createdAt)).limit(5),
    db.select({
      id: transactionsTable.id,
      reference: transactionsTable.reference,
      type: transactionsTable.type,
      status: transactionsTable.status,
      amount: transactionsTable.amount,
      fee: transactionsTable.fee,
      currency: transactionsTable.currency,
      countryCode: transactionsTable.countryCode,
      operator: transactionsTable.operator,
      phone: transactionsTable.phone,
      createdAt: transactionsTable.createdAt,
      userId: transactionsTable.userId,
    }).from(transactionsTable).where(txLiveBase).orderBy(desc(transactionsTable.createdAt)).limit(10),
    db.selectDistinct({ domain: transactionsTable.webhookUrl })
      .from(transactionsTable)
      .where(sql`${transactionsTable.webhookUrl} IS NOT NULL AND ${transactionsTable.webhookUrl} != ''`),
    db.select({
      totalFees: sum(walletExchangesTable.fee),
      totalAmount: sum(walletExchangesTable.amount),
      cnt: count(),
    }).from(walletExchangesTable).where(eq(walletExchangesTable.status, "approved")),
    db.select({ cnt: count() }).from(walletExchangesTable).where(eq(walletExchangesTable.status, "pending")),
  ]);

  const merchantIds = [...new Set(recentTx.map(t => t.userId))];
  const merchants = merchantIds.length > 0
    ? await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email })
        .from(usersTable).where(inArray(usersTable.id, merchantIds))
    : [];
  const merchantMap = Object.fromEntries(merchants.map(m => [m.id, m]));

  // Aggregations
  const payinStats = txToday.find(t => t.type === "payin");
  const payoutStats = txToday.find(t => t.type === "payout");
  const feesToday = txToday.reduce((a, t) => a + parseFloat(String(t.fees ?? 0)), 0);

  const allSuccess = txAll.filter(t => t.status === "success");
  const totalSuccessCount = allSuccess.reduce((a, t) => a + Number(t.cnt), 0);
  const totalTxCount = txAll.reduce((a, t) => a + Number(t.cnt), 0);
  const successRate = totalTxCount > 0 ? Math.round((totalSuccessCount / totalTxCount) * 100) : 0;

  const totalFeesAll = allSuccess.reduce((a, t) => a + parseFloat(String(t.fees ?? 0)), 0);
  const totalPayinVol = allSuccess.filter(t => t.type === "payin").reduce((a, t) => a + parseFloat(String(t.total ?? 0)), 0);
  const totalPayoutVol = allSuccess.filter(t => t.type === "payout").reduce((a, t) => a + parseFloat(String(t.total ?? 0)), 0);
  const totalTxVolume = totalPayinVol + totalPayoutVol;

  // Live mode (API) vs sandbox
  const liveTx = txAll.filter(t => t.mode === "live");
  const sandboxTx = txAll.filter(t => t.mode === "sandbox");
  const liveSuccess = liveTx.filter(t => t.status === "success");
  const livePayinVol = liveSuccess.filter(t => t.type === "payin").reduce((a, t) => a + parseFloat(String(t.total ?? 0)), 0);
  const livePayoutVol = liveSuccess.filter(t => t.type === "payout").reduce((a, t) => a + parseFloat(String(t.total ?? 0)), 0);
  const liveFees = liveSuccess.reduce((a, t) => a + parseFloat(String(t.fees ?? 0)), 0);
  const liveCount = liveTx.reduce((a, t) => a + Number(t.cnt), 0);
  const sandboxCount = sandboxTx.reduce((a, t) => a + Number(t.cnt), 0);

  // Domains using the API (extracted from webhook URLs)
  const domains = domainesRaw
    .map(r => { try { return new URL(r.domain ?? "").hostname; } catch { return null; } })
    .filter((d): d is string => !!d);
  const uniqueDomains = [...new Set(domains)];

  const rawPlatformBalance = parseFloat(String(soldePlateforme[0]?.total ?? 0));
  // Subtract the snapshot taken at reset so the displayed balance starts from 0 after reset
  const platformBalance = Math.max(0, rawPlatformBalance - balanceAtReset);

  res.json({
    // Users
    totalMerchants: Number(totalMerchants.count),
    totalUsers: Number(totalUsers.count),
    kybApproved: Number(kybApproved.count),
    kybPending: Number(kybPending.count),
    kybUnderReview: Number(kybUnderReview.count),
    // Wallets
    soldePlateforme: platformBalance,
    activeWallets: Number(activeWallets.count),
    totalWallets: Number(totalWallets.count),
    // Transactions today
    payinToday: { count: Number(payinStats?.cnt ?? 0), volume: parseFloat(String(payinStats?.total ?? 0)) },
    payoutToday: { count: Number(payoutStats?.cnt ?? 0), volume: parseFloat(String(payoutStats?.total ?? 0)) },
    commissionsAujourdhui: feesToday,
    // Transactions all-time
    totalPayinVolume: totalPayinVol,
    totalPayoutVolume: totalPayoutVol,
    totalTxVolume,
    totalTxCount,
    totalSuccessCount,
    successRate,
    // Commissions
    totalFees: totalFeesAll,
    feesLive: liveFees,
    // Live vs sandbox
    livePayinVolume: livePayinVol,
    livePayoutVolume: livePayoutVol,
    liveCount,
    sandboxCount,
    // API Keys
    activeApiKeys: Number(activeApiKeys.count),
    totalApiKeys: Number(totalApiKeys.count),
    // Payment Links
    totalPaymentLinks: Number(totalLinks.count),
    activePaymentLinks: Number(activeLinks.count),
    // Sites using the API
    domainesAPI: uniqueDomains,
    domainesCount: uniqueDomains.length,
    // Alerts
    recentTransactions: recentTx.map(t => ({ ...t, merchant: merchantMap[t.userId] ?? null })),
    bigTxAlerts,
    // Wallet exchanges
    exchangeFeesTotal: parseFloat(String(exchangeApproved.totalFees ?? 0)),
    exchangeVolumeTotal: parseFloat(String(exchangeApproved.totalAmount ?? 0)),
    exchangeApprovedCount: Number(exchangeApproved.cnt),
    exchangePendingCount: Number(exchangePending.cnt),
    // Reset info
    statsResetAt: statsResetAt ? statsResetAt.toISOString() : null,
  });
});

// ─── RESET STATS ─────────────────────────────────────────────────────────────
router.post(AP + "/stats/reset", requireAdmin, async (req: any, res: any) => {
  const now = new Date().toISOString();

  // Snapshot current platform balance so we can show delta = 0 after reset
  const [balanceRow] = await db.select({ total: sum(walletsTable.balance) }).from(walletsTable);
  const currentBalance = String(balanceRow?.total ?? "0");

  await Promise.all([
    db.insert(adminSettingsTable)
      .values({ key: "stats_reset_at", value: now })
      .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: now, updatedAt: new Date() } }),
    db.insert(adminSettingsTable)
      .values({ key: "platform_balance_at_reset", value: currentBalance })
      .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: currentBalance, updatedAt: new Date() } }),
  ]);

  await logAdminAction(req.session.userId, "RESET_STATS", "platform", "stats", `balance_snapshot=${currentBalance}`, req.ip);
  res.json({ ok: true, resetAt: now });
});

// ─── CHART DATA ───────────────────────────────────────────────────────────────
router.get(AP + "/chart-data", requireAdmin, async (_req: any, res: any) => {
  const days = 30;
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const rows = await db.select({
      type: transactionsTable.type,
      total: sum(transactionsTable.amount),
      cnt: count(),
    }).from(transactionsTable)
      .where(and(gte(transactionsTable.createdAt, d), lt(transactionsTable.createdAt, next), eq(transactionsTable.status, "success"), eq(transactionsTable.mode, "live")))
      .groupBy(transactionsTable.type);

    const payin = rows.find(r => r.type === "payin");
    const payout = rows.find(r => r.type === "payout");
    result.push({
      date: d.toISOString().slice(0, 10),
      payin: parseFloat(String(payin?.total ?? 0)),
      payout: parseFloat(String(payout?.total ?? 0)),
      payinCount: Number(payin?.cnt ?? 0),
      payoutCount: Number(payout?.cnt ?? 0),
    });
  }
  res.json(result);
});

// ─── MERCHANTS ────────────────────────────────────────────────────────────────
router.get(AP + "/merchants", requireAdmin, async (req: any, res: any) => {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limitNum).offset(offset);
  if (search) {
    const q = search.toLowerCase();
    users = users.filter(u =>
      u.email.toLowerCase().includes(q) ||
      u.companyName.toLowerCase().includes(q) ||
      (u.merchantCode ?? "").toLowerCase().includes(q)
    );
  }

  const [{ total }] = await db.select({ total: count() }).from(usersTable);

  const enriched = await Promise.all(users.map(async (u) => {
    const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, u.id));
    const [kyb] = await db.select({ status: kybSubmissionsTable.status }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.userId, u.id));
    const [txStats] = await db.select({ total: sum(transactionsTable.amount), cnt: count() })
      .from(transactionsTable).where(eq(transactionsTable.userId, u.id));
    return {
      ...u, passwordHash: undefined,
      wallets,
      kybStatus: kyb?.status ?? "pending",
      totalVolume: parseFloat(String(txStats?.total ?? 0)),
      txCount: Number(txStats?.cnt ?? 0),
    };
  }));

  res.json({ merchants: enriched, total: Number(total), page: pageNum, limit: limitNum });
});

router.get(AP + "/merchants/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, id));
  const [kyb] = await db.select().from(kybSubmissionsTable).where(eq(kybSubmissionsTable.userId, id));
  const apiKeys = await db.select({ id: apiKeysTable.id, name: apiKeysTable.name, description: apiKeysTable.description, prefix: apiKeysTable.prefix, env: apiKeysTable.env, status: apiKeysTable.status, createdAt: apiKeysTable.createdAt })
    .from(apiKeysTable).where(eq(apiKeysTable.userId, id));
  const webhooks = await db.select().from(userWebhooksTable).where(eq(userWebhooksTable.userId, id)).orderBy(asc(userWebhooksTable.createdAt));
  const allowedIps = await db.select().from(userAllowedIpsTable).where(eq(userAllowedIpsTable.userId, id)).orderBy(asc(userAllowedIpsTable.createdAt));
  const recentTx = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, id)).orderBy(desc(transactionsTable.createdAt)).limit(20);
  res.json({ ...user, passwordHash: undefined, wallets, kyb, apiKeys, webhooks, allowedIps, recentTransactions: recentTx });
});

router.put(AP + "/merchants/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { companyName, email, country, role, payinFeePercent, payoutFeePercent } = req.body;
  const updateData: any = {};
  if (companyName) updateData.companyName = companyName;
  if (email) updateData.email = email;
  if (country) updateData.country = country;
  if (role && ["admin", "user"].includes(role)) updateData.role = role;
  if (payinFeePercent !== undefined) {
    updateData.payinFeePercent = payinFeePercent === null || payinFeePercent === "" ? null : String(payinFeePercent);
  }
  if (payoutFeePercent !== undefined) {
    updateData.payoutFeePercent = payoutFeePercent === null || payoutFeePercent === "" ? null : String(payoutFeePercent);
  }
  await db.update(usersTable).set(updateData).where(eq(usersTable.id, id));
  await logAdminAction(req.session.userId, "UPDATE_MERCHANT", "user", String(id), JSON.stringify(updateData), req.ip);
  res.json({ ok: true });
});

router.patch(AP + "/merchants/:id/toggle-support-agent", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, isSupportAgent: usersTable.isSupportAgent })
    .from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  const next = !user.isSupportAgent;
  await db.update(usersTable).set({ isSupportAgent: next }).where(eq(usersTable.id, id));
  await logAdminAction(req.session.userId, next ? "GRANT_SUPPORT_AGENT" : "REVOKE_SUPPORT_AGENT", "user", String(id), user.email, req.ip);
  res.json({ ok: true, isSupportAgent: next });
});

router.get(AP + "/merchants/support-agents", requireAdmin, async (_req: any, res: any) => {
  const agents = await db.select({
    id: usersTable.id, email: usersTable.email, companyName: usersTable.companyName,
    country: usersTable.country, createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.isSupportAgent, true)).orderBy(asc(usersTable.companyName));
  res.json({ agents });
});

router.put(AP + "/merchants/:id/role", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (id === req.session.userId) { res.status(400).json({ error: "Vous ne pouvez pas modifier votre propre rôle" }); return; }
  const { role } = req.body;
  if (!role || !["admin", "user"].includes(role)) { res.status(400).json({ error: "Rôle invalide" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  await db.update(usersTable).set({ role }).where(eq(usersTable.id, id));
  const action = role === "admin" ? "PROMOTE_ADMIN" : "DEMOTE_ADMIN";
  await logAdminAction(req.session.userId, action, "user", String(id), `${user.email} → role: ${role}`, req.ip);
  res.json({ ok: true, role });
});

router.post(AP + "/merchants/:id/suspend", requireAdmin, async (req: any, res: any) => {
  res.json({ ok: true, message: "Compte suspendu (flag non implémenté en DB, logué)" });
  await logAdminAction(req.session.userId, "SUSPEND_MERCHANT", "user", req.params.id, undefined, req.ip);
});

router.post(AP + "/merchants/:id/activate", requireAdmin, async (req: any, res: any) => {
  res.json({ ok: true, message: "Compte réactivé" });
  await logAdminAction(req.session.userId, "ACTIVATE_MERCHANT", "user", req.params.id, undefined, req.ip);
});

router.post(AP + "/merchants/:id/reset-password", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const newPassword = crypto.randomBytes(8).toString("hex");
  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, id));
  await logAdminAction(req.session.userId, "RESET_PASSWORD", "user", String(id), undefined, req.ip);
  res.json({ ok: true, newPassword });
});

router.delete(AP + "/merchants/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (id === req.session.userId) { res.status(400).json({ error: "Cannot delete yourself" }); return; }
  try {
    await logAdminAction(req.session.userId, "DELETE_MERCHANT", "user", String(id), undefined, req.ip);
    // Cascade-delete in FK-safe order (many tables reference users without onDelete:cascade)
    await db.delete(walletExchangesTable).where(eq(walletExchangesTable.userId, id));
    await db.delete(reversementsTable).where(eq(reversementsTable.userId, id));
    await db.delete(transactionsTable).where(eq(transactionsTable.userId, id));
    await db.delete(paymentLinkAttemptsTable).where(eq(paymentLinkAttemptsTable.merchantId, id));
    await db.delete(paymentLinksTable).where(eq(paymentLinksTable.userId, id));
    await db.delete(walletsTable).where(eq(walletsTable.userId, id));
    await db.delete(userWebhooksTable).where(eq(userWebhooksTable.userId, id));
    await db.delete(userAllowedIpsTable).where(eq(userAllowedIpsTable.userId, id));
    await db.delete(apiKeysTable).where(eq(apiKeysTable.userId, id));
    await db.delete(kybSubmissionsTable).where(eq(kybSubmissionsTable.userId, id));
    await db.delete(virtualCardOrdersTable).where(eq(virtualCardOrdersTable.userId, id));
    await db.delete(massPayoutJobsTable).where(eq(massPayoutJobsTable.userId, id));
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, id));
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, id));
    await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.userId, id));
    await db.delete(knownDevicesTable).where(eq(knownDevicesTable.userId, id));
    await db.update(globalBannersTable).set({ createdById: null }).where(eq(globalBannersTable.createdById, id));
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "Impossible de supprimer ce marchand : " + (err?.message ?? String(err)) });
  }
});

router.put(AP + "/merchants/:userId/wallets/:walletId", requireAdmin, async (req: any, res: any) => {
  const walletId = parseInt(req.params.walletId);
  const { balance } = req.body;
  if (balance === undefined || isNaN(parseFloat(balance))) { res.status(400).json({ error: "Invalid balance" }); return; }
  await db.update(walletsTable).set({ balance: String(parseFloat(balance)) }).where(eq(walletsTable.id, walletId));
  await logAdminAction(req.session.userId, "EDIT_WALLET_BALANCE", "wallet", String(walletId), `New balance: ${balance}`, req.ip);
  res.json({ ok: true });
});

// ─── KYB ─────────────────────────────────────────────────────────────────────
router.get(AP + "/kyb", requireAdmin, async (req: any, res: any) => {
  const {
    status, page = "1", limit = "20",
    search = "", country = "", dateFrom = "", dateTo = "",
    sortBy = "createdAt", sortDir = "desc",
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];

  if (status && status !== "all") {
    conditions.push(eq(kybSubmissionsTable.status, status as any));
  }
  if (country) {
    conditions.push(sql`lower(${kybSubmissionsTable.incorporationCountry}) = lower(${country})`);
  }
  if (dateFrom) {
    conditions.push(gte(kybSubmissionsTable.createdAt, new Date(dateFrom)));
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    conditions.push(lt(kybSubmissionsTable.createdAt, to));
  }
  if (search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    conditions.push(sql`(
      lower(${usersTable.email}) LIKE ${q}
      OR lower(${usersTable.companyName}) LIKE ${q}
      OR lower(coalesce(${kybSubmissionsTable.companyLegalName}, '')) LIKE ${q}
      OR lower(coalesce(${kybSubmissionsTable.tradeName}, '')) LIKE ${q}
      OR lower(coalesce(${kybSubmissionsTable.legalRepName}, '')) LIKE ${q}
    )`);
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const orderCol = sortBy === "submittedAt" ? kybSubmissionsTable.submittedAt
    : sortBy === "status" ? kybSubmissionsTable.status
    : kybSubmissionsTable.createdAt;
  const orderFn = sortDir === "asc" ? asc(orderCol) : desc(orderCol);

  const [submissions, [{ total }], countries] = await Promise.all([
    db.select({
      id: kybSubmissionsTable.id,
      userId: kybSubmissionsTable.userId,
      status: kybSubmissionsTable.status,
      companyLegalName: kybSubmissionsTable.companyLegalName,
      tradeName: kybSubmissionsTable.tradeName,
      incorporationCountry: kybSubmissionsTable.incorporationCountry,
      city: kybSubmissionsTable.city,
      businessType: kybSubmissionsTable.businessType,
      website: kybSubmissionsTable.website,
      registrationNumber: kybSubmissionsTable.registrationNumber,
      taxNumber: kybSubmissionsTable.taxNumber,
      businessAddress: kybSubmissionsTable.businessAddress,
      businessDescription: kybSubmissionsTable.businessDescription,
      foundingDate: kybSubmissionsTable.foundingDate,
      legalRepName: kybSubmissionsTable.legalRepName,
      legalRepDob: kybSubmissionsTable.legalRepDob,
      legalRepNationality: kybSubmissionsTable.legalRepNationality,
      legalRepPhone: kybSubmissionsTable.legalRepPhone,
      legalRepEmail: kybSubmissionsTable.legalRepEmail,
      legalRepPosition: kybSubmissionsTable.legalRepPosition,
      legalRepIdType: kybSubmissionsTable.legalRepIdType,
      legalRepIdNumber: kybSubmissionsTable.legalRepIdNumber,
      legalRepIdExpiry: kybSubmissionsTable.legalRepIdExpiry,
      documentIdFront: kybSubmissionsTable.documentIdFront,
      documentIdBack: kybSubmissionsTable.documentIdBack,
      documentSelfie: kybSubmissionsTable.documentSelfie,
      documentRccm: kybSubmissionsTable.documentRccm,
      documentCertificate: kybSubmissionsTable.documentCertificate,
      documentProofAddress: kybSubmissionsTable.documentProofAddress,
      documentBankStatement: kybSubmissionsTable.documentBankStatement,
      documentStatuts: kybSubmissionsTable.documentStatuts,
      documentLicense: kybSubmissionsTable.documentLicense,
      documentId: kybSubmissionsTable.documentId,
      contractEmail: kybSubmissionsTable.contractEmail,
      contractVersion: kybSubmissionsTable.contractVersion,
      contractSignedAt: kybSubmissionsTable.contractSignedAt,
      contractIp: kybSubmissionsTable.contractIp,
      contractAccepted: kybSubmissionsTable.contractAccepted,
      rejectionReason: kybSubmissionsTable.rejectionReason,
      submittedAt: kybSubmissionsTable.submittedAt,
      reviewedAt: kybSubmissionsTable.reviewedAt,
      createdAt: kybSubmissionsTable.createdAt,
      userEmail: usersTable.email,
      userCompanyName: usersTable.companyName,
    })
    .from(kybSubmissionsTable)
    .innerJoin(usersTable, eq(kybSubmissionsTable.userId, usersTable.id))
    .where(whereClause)
    .orderBy(orderFn)
    .limit(limitNum).offset(offset),

    db.select({ total: count() })
      .from(kybSubmissionsTable)
      .innerJoin(usersTable, eq(kybSubmissionsTable.userId, usersTable.id))
      .where(whereClause),

    db.selectDistinct({ country: kybSubmissionsTable.incorporationCountry })
      .from(kybSubmissionsTable)
      .where(sql`${kybSubmissionsTable.incorporationCountry} IS NOT NULL AND ${kybSubmissionsTable.incorporationCountry} != ''`),
  ]);

  const enriched = submissions.map(s => ({
    ...s,
    user: { id: s.userId, email: s.userEmail, companyName: s.userCompanyName },
  }));

  const availableCountries = countries.map(c => c.country).filter(Boolean).sort();

  res.json({ kyb: enriched, total: Number(total), page: pageNum, limit: limitNum, availableCountries });
});

router.put(AP + "/kyb/:id/approve", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.update(kybSubmissionsTable).set({ status: "approved", reviewedAt: new Date() }).where(eq(kybSubmissionsTable.id, id));
  await logAdminAction(req.session.userId, "APPROVE_KYB", "kyb", String(id), undefined, req.ip);

  try {
    const [kyb] = await db.select({
      company: kybSubmissionsTable.companyLegalName,
      contractEmail: kybSubmissionsTable.contractEmail,
      userId: kybSubmissionsTable.userId,
    }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.id, id));
    const [admin] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.session.userId));

    if (kyb) {
      // Notification in-app au marchand
      db.insert(notificationsTable).values({
        userId: kyb.userId,
        type: "success",
        category: "kyb",
        title: "KYB approuvé — Compte Live activé",
        body: "Votre dossier KYB a été approuvé. Votre compte est maintenant en mode Live et vous pouvez recevoir de vrais paiements.",
        href: "/dashboard/kyb",
      }).catch(() => {});

      // Telegram
      notifyKybDecision({ company: kyb.company ?? "?", email: kyb.contractEmail ?? "?", decision: "approved", adminEmail: admin?.email ?? "?" }).catch(() => {});

      // Email au marchand
      const [user] = await db.select({ email: usersTable.email, companyName: usersTable.companyName })
        .from(usersTable).where(eq(usersTable.id, kyb.userId));
      if (user) {
        sendKybApprovedEmail({ to: user.email, companyName: kyb.company ?? user.companyName }).catch(() => {});
      }
    }
  } catch {}

  res.json({ ok: true });
});

router.put(AP + "/kyb/:id/reject", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  if (!reason?.trim()) {
    res.status(400).json({ error: "La raison du rejet est obligatoire." });
    return;
  }
  await db.update(kybSubmissionsTable).set({ status: "rejected", rejectionReason: reason.trim(), reviewedAt: new Date() }).where(eq(kybSubmissionsTable.id, id));
  await logAdminAction(req.session.userId, "REJECT_KYB", "kyb", String(id), reason, req.ip);

  try {
    const [kyb] = await db.select({
      company: kybSubmissionsTable.companyLegalName,
      contractEmail: kybSubmissionsTable.contractEmail,
      userId: kybSubmissionsTable.userId,
    }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.id, id));
    const [admin] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.session.userId));

    if (kyb) {
      // Notification in-app au marchand
      db.insert(notificationsTable).values({
        userId: kyb.userId,
        type: "error",
        category: "kyb",
        title: "KYB refusé — Action requise",
        body: `Votre dossier KYB a été refusé. Motif : ${reason.trim()}. Veuillez soumettre à nouveau avec les documents corrects.`,
        href: "/dashboard/kyb",
      }).catch(() => {});

      // Telegram
      notifyKybDecision({ company: kyb.company ?? "?", email: kyb.contractEmail ?? "?", decision: "rejected", reason, adminEmail: admin?.email ?? "?" }).catch(() => {});

      // Email au marchand avec la raison
      const [user] = await db.select({ email: usersTable.email, companyName: usersTable.companyName })
        .from(usersTable).where(eq(usersTable.id, kyb.userId));
      if (user) {
        sendKybRejectedEmail({ to: user.email, companyName: kyb.company ?? user.companyName, reason: reason.trim() }).catch(() => {});
      }
    }
  } catch {}

  res.json({ ok: true });
});

router.put(AP + "/kyb/:id/review", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.update(kybSubmissionsTable).set({ status: "under_review" }).where(eq(kybSubmissionsTable.id, id));
  await logAdminAction(req.session.userId, "REVIEW_KYB", "kyb", String(id), undefined, req.ip);
  res.json({ ok: true });
});

const ALLOWED_DOC_FIELDS = [
  "documentIdFront", "documentIdBack", "documentSelfie",
  "documentRccm", "documentCertificate", "documentProofAddress",
  "documentBankStatement", "documentStatuts", "documentLicense", "documentId",
];

router.get(AP + "/kyb/:id/document/:field", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { field } = req.params;

  if (!ALLOWED_DOC_FIELDS.includes(field)) {
    res.status(400).json({ error: "Champ document invalide" });
    return;
  }

  const [kyb] = await db.select().from(kybSubmissionsTable).where(eq(kybSubmissionsTable.id, id));
  if (!kyb) { res.status(404).json({ error: "Dossier KYB introuvable" }); return; }

  const storagePath: string | null = (kyb as any)[field] ?? null;
  if (!storagePath) { res.status(404).json({ error: "Document non soumis" }); return; }

  try {
    const buffer = await downloadKybDocument(storagePath);
    const basename = path.basename(storagePath);
    const ext = path.extname(basename).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".png": "image/png", ".gif": "image/gif",
      ".webp": "image/webp", ".heic": "image/heic",
    };
    const contentType = mimeMap[ext] ?? "application/octet-stream";
    const disposition = req.query.download === "1" ? "attachment" : "inline";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `${disposition}; filename="${basename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err: any) {
    console.error("[Admin KYB doc]", err?.message);
    res.status(404).json({ error: "Fichier introuvable dans le stockage" });
  }
});

// ─── CONTRACT PDF DOWNLOAD ────────────────────────────────────────────────────
router.get(AP + "/kyb/:id/contract", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const [kyb] = await db
    .select()
    .from(kybSubmissionsTable)
    .where(eq(kybSubmissionsTable.id, id));

  if (!kyb) { res.status(404).json({ error: "Dossier KYB introuvable" }); return; }

  if (!kyb.contractAccepted && !kyb.contractSignedAt) {
    res.status(404).json({ error: "Ce marchand n'a pas encore signé de contrat." }); return;
  }

  try {
    const pdfBuf = await generateContractPdf({
      companyLegalName:     kyb.companyLegalName     ?? undefined,
      tradeName:            kyb.tradeName             ?? undefined,
      businessType:         kyb.businessType          ?? undefined,
      incorporationCountry: kyb.incorporationCountry  ?? undefined,
      city:                 kyb.city                  ?? undefined,
      businessAddress:      kyb.businessAddress       ?? undefined,
      registrationNumber:   kyb.registrationNumber    ?? undefined,
      taxNumber:            kyb.taxNumber             ?? undefined,
      foundingDate:         kyb.foundingDate           ?? undefined,
      legalRepName:         kyb.legalRepName           ?? undefined,
      legalRepPosition:     kyb.legalRepPosition       ?? undefined,
      legalRepNationality:  kyb.legalRepNationality    ?? undefined,
      contractEmail:        kyb.contractEmail          ?? undefined,
      contractSignedAt:     kyb.contractSignedAt       ?? undefined,
    });

    const company = (kyb.companyLegalName ?? kyb.tradeName ?? `kyb-${id}`)
      .replace(/[^a-zA-Z0-9\-_]/g, "_");
    const filename = `contrat-drimpay-${company}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuf.length);
    res.send(pdfBuf);
  } catch (err: any) {
    console.error("[CONTRACT PDF]", err);
    res.status(500).json({ error: "Erreur lors de la génération du PDF", details: err?.message });
  }
});

// ─── CONTRACT TEMPLATE MANAGEMENT ────────────────────────────────────────────

// GET /api/admin/contract/info — metadata of the current DOCX template in Supabase
router.get(AP + "/contract/info", requireAdmin, async (_req: any, res: any) => {
  const info = await getContractTemplateInfo();
  if (!info) {
    res.json({ ok: false, error: "Fichier non trouvé dans Supabase" });
    return;
  }
  res.json({ ok: true, size: info.size, updatedAt: info.updatedAt });
});

// POST /api/admin/contract/upload — replace the DOCX template in Supabase
router.post(
  "/admin/contract/upload",
  requireAdmin,
  contractUpload.single("contract"),
  async (req: any, res: any) => {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ error: "Aucun fichier reçu ou format invalide (seuls les .docx sont acceptés)." });
      return;
    }
    try {
      await uploadContractTemplateBuffer(file.buffer);
      await logAdminAction(req.session.userId, "UPLOAD_CONTRACT_TEMPLATE", "contract", undefined, `${file.originalname} (${file.size} octets)`, req.ip);
      res.json({ ok: true, size: file.size, originalName: file.originalname });
    } catch (err: any) {
      console.error("[Admin] Contract upload error:", err?.message);
      res.status(500).json({ error: err?.message ?? "Erreur lors de l'upload" });
    }
  }
);

// GET /api/admin/contract/download — download the current DOCX template from Supabase
router.get(AP + "/contract/download", requireAdmin, async (_req: any, res: any) => {
  try {
    const buf = await downloadContractTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", 'attachment; filename="contrat-drimpay.docx"');
    res.setHeader("Content-Length", buf.length);
    res.send(buf);
  } catch (err: any) {
    console.error("[Admin] Contract download error:", err?.message);
    res.status(404).json({ error: "Fichier introuvable" });
  }
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
router.get(AP + "/transactions", requireAdmin, async (req: any, res: any) => {
  const { type, status, countryCode, operator, search, mode, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (type && type !== "all") conditions.push(eq(transactionsTable.type, type as any));
  if (status && status !== "all") conditions.push(eq(transactionsTable.status, status as any));
  if (countryCode && countryCode !== "all") conditions.push(eq(transactionsTable.countryCode, countryCode));
  if (operator && operator !== "all") conditions.push(eq(transactionsTable.operator, operator));
  if (mode && mode !== "all") conditions.push(eq(transactionsTable.mode, mode as any));

  const where = conditions.length ? and(...conditions) : undefined;

  let txs = await db.select().from(transactionsTable)
    .where(where)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limitNum).offset(offset);

  if (search) {
    const q = search.toLowerCase();
    txs = txs.filter(t =>
      t.reference.toLowerCase().includes(q) ||
      t.phone.toLowerCase().includes(q) ||
      (t.orderId ?? "").toLowerCase().includes(q)
    );
  }

  const [{ total }] = await db.select({ total: count() }).from(transactionsTable).where(where);

  const userIds = [...new Set(txs.map(t => t.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email })
        .from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json({
    transactions: txs.map(t => ({ ...t, merchant: userMap[t.userId] ?? null })),
    total: Number(total), page: pageNum, limit: limitNum,
  });
});

// ─── FORCE-RESOLVE TRANSACTION (résolution manuelle admin) ───────────────────
router.post(AP + "/transactions/:id/force-resolve", requireAdmin, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

    const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!tx) { res.status(404).json({ error: "Transaction introuvable" }); return; }

    if (tx.type !== "payin") {
      res.status(400).json({ error: "Seules les transactions pay-in peuvent être force-résolues" });
      return;
    }
    if (tx.status === "success") {
      res.status(400).json({ error: "Transaction déjà en succès" });
      return;
    }

    // Atomique : statut + crédit wallet dans une seule transaction DB
    const { credited } = await settlePayinStatus({
      txId: tx.id,
      status: "success",
      gateway: "paydunya",
    });

    await logAdminAction(
      req.session.userId,
      "FORCE_RESOLVE_TRANSACTION",
      "transaction",
      String(id),
      `ref: ${tx.reference} | amount: ${tx.amount} ${tx.currency} | net: ${tx.netAmount} | credited: ${credited}`,
      req.ip,
    );

    res.json({ ok: true, credited, message: `Transaction ${tx.reference} résolue manuellement. Wallet crédité de ${tx.netAmount} ${tx.currency}.` });
  } catch (err: any) {
    console.error("[admin/force-resolve]", err?.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── SYNC FROM GATEWAY (vérifie le statut réel chez PayDunya/Clapay) ──────────
router.post(AP + "/transactions/:id/sync-gateway", requireAdmin, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

    const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!tx) { res.status(404).json({ error: "Transaction introuvable" }); return; }

    if (tx.type !== "payin") {
      res.status(400).json({ error: "Seules les pay-in peuvent être synchronisées" });
      return;
    }
    if (!tx.externalRef) {
      res.status(400).json({ error: "Pas de référence externe — impossible d'interroger la passerelle" });
      return;
    }

    // Interroger la passerelle pour avoir le statut réel
    const { aggregator, client } = await resolveAggregator(tx.countryCode, tx.operator);

    let gatewayStatus: string;
    let gatewayRef = tx.externalRef;

    if (aggregator === "clapay") {
      const { ClapayClient } = await import("../lib/clapay.js");
      const r = await (client as InstanceType<typeof ClapayClient>).getStatus(tx.externalRef);
      gatewayStatus = r.status;
    } else {
      const { PayDunyaClient } = await import("../lib/paydunya.js");
      const pd = client as InstanceType<typeof PayDunyaClient>;
      const r = await pd.getStatus(tx.externalRef);
      const rs = r.status as string;
      gatewayStatus = rs === "completed" ? "success"
        : rs === "failed"    ? "failed"
        : rs === "cancelled" ? "cancelled"
        : rs === "expired"   ? "expired"
        : "pending";
      if (r.paydunya_reference) gatewayRef = r.paydunya_reference;
    }

    // Si confirmé chez la passerelle → créditer via settlePayinStatus (idempotent)
    const isSettled = ["success", "failed", "cancelled", "expired"].includes(gatewayStatus);
    let credited = false;

    if (isSettled) {
      const result = await settlePayinStatus({
        txId: tx.id,
        status: gatewayStatus as any,
        gatewayReference: gatewayRef,
        gateway: aggregator,
      });
      credited = result.credited;
    }

    await logAdminAction(
      req.session.userId,
      "SYNC_GATEWAY_TRANSACTION",
      "transaction",
      String(id),
      JSON.stringify({ ref: tx.reference, aggregator, gatewayStatus, credited }),
      req.ip,
    );

    res.json({ ok: true, aggregator, gatewayStatus, credited, settled: isSettled });
  } catch (err: any) {
    console.error("[admin/sync-gateway]", err?.message);
    res.status(500).json({ error: err?.message ?? "Erreur lors de la synchronisation" });
  }
});

// ─── WALLETS ──────────────────────────────────────────────────────────────────
router.get(AP + "/wallets", requireAdmin, async (_req: any, res: any) => {
  const wallets = await db.select().from(walletsTable).orderBy(walletsTable.countryCode);
  const userIds = [...new Set(wallets.map(w => w.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email })
        .from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const COUNTRY_MAP: Record<string, { name: string; flag: string; currency: string }> = {
    TG: { name: "Togo", flag: "🇹🇬", currency: "XOF" },
    BJ: { name: "Bénin", flag: "🇧🇯", currency: "XOF" },
    CM: { name: "Cameroun", flag: "🇨🇲", currency: "XAF" },
    BF: { name: "Burkina Faso", flag: "🇧🇫", currency: "XOF" },
    ML: { name: "Mali", flag: "🇲🇱", currency: "XOF" },
    SN: { name: "Sénégal", flag: "🇸🇳", currency: "XOF" },
    CI: { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
  };

  const byCountry = Object.entries(COUNTRY_MAP).map(([code, info]) => {
    const countryWallets = wallets.filter(w => w.countryCode === code);
    const totalBalance = countryWallets.reduce((a, w) => a + parseFloat(String(w.balance)), 0);
    return {
      countryCode: code,
      ...info,
      walletCount: countryWallets.length,
      totalBalance,
      wallets: countryWallets.map(w => ({ ...w, merchant: userMap[w.userId] ?? null })),
    };
  });

  res.json(byCountry);
});

router.post(AP + "/wallets/:id/credit", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { amount, note } = req.body;
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }
  await db.update(walletsTable).set({ balance: sql`${walletsTable.balance} + ${parseFloat(amount)}` }).where(eq(walletsTable.id, id));
  await logAdminAction(req.session.userId, "CREDIT_WALLET", "wallet", String(id), `Amount: ${amount}, Note: ${note}`, req.ip);
  res.json({ ok: true });
});

router.post(AP + "/wallets/:id/debit", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { amount, note } = req.body;
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.id, id));
  if (!wallet || parseFloat(String(wallet.balance)) < parseFloat(amount)) { res.status(400).json({ error: "Insufficient balance" }); return; }
  await db.update(walletsTable).set({ balance: sql`${walletsTable.balance} - ${parseFloat(amount)}` }).where(eq(walletsTable.id, id));
  await logAdminAction(req.session.userId, "DEBIT_WALLET", "wallet", String(id), `Amount: ${amount}, Note: ${note}`, req.ip);
  res.json({ ok: true });
});

// ─── AGGREGATORS ──────────────────────────────────────────────────────────────
router.get(AP + "/aggregators", requireAdmin, async (_req: any, res: any) => {
  const aggs = await db.select().from(aggregatorsTable).orderBy(aggregatorsTable.name);
  const opAggs = await db.select().from(operatorAggregatorsTable).orderBy(operatorAggregatorsTable.countryCode);
  res.json({ aggregators: aggs, operatorAggregators: opAggs });
});

// ─── WALLET EXCHANGES ─────────────────────────────────────────────────────────
router.get(AP + "/wallet-exchanges", requireAdmin, async (req: any, res: any) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;
  const mode = req.query.mode as string | undefined;

  const conditions = [];
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    conditions.push(eq(walletExchangesTable.status, status as any));
  }
  if (mode && ["sandbox", "live"].includes(mode)) {
    conditions.push(eq(walletExchangesTable.mode, mode as any));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ c: total }] = await db.select({ c: count() }).from(walletExchangesTable).where(where as any);
  const rows = await db
    .select()
    .from(walletExchangesTable)
    .where(where as any)
    .orderBy(desc(walletExchangesTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const userIds = [...new Set(rows.map(r => r.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email })
        .from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json({
    exchanges: rows.map(r => ({ ...r, merchant: userMap[r.userId] ?? null })),
    total: Number(total),
  });
});

router.get(AP + "/wallet-exchanges/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const [exchange] = await db.select().from(walletExchangesTable).where(eq(walletExchangesTable.id, id));
  if (!exchange) { res.status(404).json({ error: "Demande introuvable" }); return; }

  const [merchant] = await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email, country: usersTable.country })
    .from(usersTable).where(eq(usersTable.id, exchange.userId));
  const [fromWallet] = await db.select().from(walletsTable).where(eq(walletsTable.id, exchange.fromWalletId));
  const [toWallet] = await db.select().from(walletsTable).where(eq(walletsTable.id, exchange.toWalletId));

  res.json({ exchange, merchant: merchant ?? null, fromWallet: fromWallet ?? null, toWallet: toWallet ?? null });
});

router.post(AP + "/wallet-exchanges/:id/approve", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const [admin] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.session.userId));
  const result = await approveWalletExchange(id, admin?.email ?? "Admin");
  if (!result.ok) { res.status(400).json({ error: result.error }); return; }
  await logAdminAction(req.session.userId, "APPROVE_WALLET_EXCHANGE", "wallet_exchange", String(id), undefined, req.ip);
  res.json({ ok: true });
});

router.post(AP + "/wallet-exchanges/:id/reject", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  if (!reason?.trim()) {
    res.status(400).json({ error: "La raison du rejet est obligatoire." });
    return;
  }
  const [admin] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.session.userId));
  const result = await rejectWalletExchange(id, reason.trim(), admin?.email ?? "Admin");
  if (!result.ok) { res.status(400).json({ error: result.error }); return; }
  await logAdminAction(req.session.userId, "REJECT_WALLET_EXCHANGE", "wallet_exchange", String(id), reason, req.ip);
  res.json({ ok: true });
});

router.post(AP + "/aggregators", requireAdmin, async (req: any, res: any) => {
  const { name, code, description } = req.body;
  if (!name || !code) { res.status(400).json({ error: "name and code required" }); return; }
  const [agg] = await db.insert(aggregatorsTable).values({ name, code, description }).returning();
  await logAdminAction(req.session.userId, "CREATE_AGGREGATOR", "aggregator", agg.code, name, req.ip);
  res.status(201).json(agg);
});

router.put(AP + "/aggregators/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { name, description, active } = req.body;
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (active !== undefined) data.active = active;
  await db.update(aggregatorsTable).set(data).where(eq(aggregatorsTable.id, id));
  await logAdminAction(req.session.userId, "UPDATE_AGGREGATOR", "aggregator", String(id), JSON.stringify(data), req.ip);
  res.json({ ok: true });
});

router.post(AP + "/operator-aggregators", requireAdmin, async (req: any, res: any) => {
  const { countryCode, operatorName, operatorType, aggregatorCode, dailyLimit, priority } = req.body;
  if (!countryCode || !operatorName || !aggregatorCode) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [oa] = await db.insert(operatorAggregatorsTable).values({
    countryCode, operatorName, operatorType: operatorType ?? "mobile-money",
    aggregatorCode, dailyLimit: dailyLimit ?? "1000000", priority: priority ?? 1,
  }).returning();
  await logAdminAction(req.session.userId, "CREATE_OPERATOR_AGG", "operator_aggregator", String(oa.id), `${countryCode}/${operatorName} → ${aggregatorCode}`, req.ip);
  res.status(201).json(oa);
});

router.put(AP + "/operator-aggregators/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { aggregatorCode, dailyLimit, active, priority, blockDeposits, blockWithdrawals, blockApi, blockPaymentLinks, maintenanceMode } = req.body;
  const data: any = { updatedAt: new Date() };
  if (aggregatorCode !== undefined) data.aggregatorCode = aggregatorCode;
  if (dailyLimit !== undefined) data.dailyLimit = String(dailyLimit);
  if (active !== undefined) data.active = active;
  if (priority !== undefined) data.priority = priority;
  if (blockDeposits !== undefined) data.blockDeposits = blockDeposits;
  if (blockWithdrawals !== undefined) data.blockWithdrawals = blockWithdrawals;
  if (blockApi !== undefined) data.blockApi = blockApi;
  if (blockPaymentLinks !== undefined) data.blockPaymentLinks = blockPaymentLinks;
  if (maintenanceMode !== undefined) data.maintenanceMode = maintenanceMode;
  await db.update(operatorAggregatorsTable).set(data).where(eq(operatorAggregatorsTable.id, id));
  await logAdminAction(req.session.userId, "UPDATE_OPERATOR_AGG", "operator_aggregator", String(id), JSON.stringify(data), req.ip);
  res.json({ ok: true });
});

router.delete(AP + "/operator-aggregators/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.delete(operatorAggregatorsTable).where(eq(operatorAggregatorsTable.id, id));
  await logAdminAction(req.session.userId, "DELETE_OPERATOR_AGG", "operator_aggregator", String(id), undefined, req.ip);
  res.json({ ok: true });
});

// ─── OPERATORS ────────────────────────────────────────────────────────────────
router.get(AP + "/operators", requireAdmin, async (_req: any, res: any) => {
  const ops = await db.select().from(operatorsTable).orderBy(operatorsTable.countryCode, operatorsTable.name);
  const opAggs = await db.select().from(operatorAggregatorsTable).orderBy(operatorAggregatorsTable.priority);
  const aggs = await db.select().from(aggregatorsTable).where(eq(aggregatorsTable.active, true)).orderBy(aggregatorsTable.name);
  res.json({ operators: ops, operatorAggregators: opAggs, aggregators: aggs });
});

router.post(AP + "/operators", requireAdmin, async (req: any, res: any) => {
  const { countryCode, name, type, aggregatorCode, dailyLimit } = req.body;
  if (!countryCode || !name || !type) { res.status(400).json({ error: "Missing fields" }); return; }
  const [op] = await db.insert(operatorsTable).values({ countryCode, name, type }).returning();
  if (aggregatorCode) {
    await db.insert(operatorAggregatorsTable).values({
      countryCode, operatorName: name, operatorType: type,
      aggregatorCode, dailyLimit: dailyLimit ?? "1000000", priority: 1,
    });
  }
  await logAdminAction(req.session.userId, "CREATE_OPERATOR", "operator", String(op.id), `${countryCode}/${name}`, req.ip);
  res.status(201).json(op);
});

router.put(AP + "/operators/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { name, type, active, aggregatorCode, dailyLimit, blockDeposits, blockWithdrawals, blockApi, blockPaymentLinks, maintenanceMode } = req.body;
  const [existing] = await db.select().from(operatorsTable).where(eq(operatorsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Operator not found" }); return; }
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (type !== undefined) data.type = type;
  if (active !== undefined) data.active = active;
  await db.update(operatorsTable).set(data).where(eq(operatorsTable.id, id));
  const newName = name ?? existing.name;
  const newType = type ?? existing.type;
  if (aggregatorCode !== undefined || dailyLimit !== undefined || blockDeposits !== undefined || blockWithdrawals !== undefined || blockApi !== undefined || blockPaymentLinks !== undefined || maintenanceMode !== undefined) {
    const [existingAgg] = await db.select().from(operatorAggregatorsTable)
      .where(and(eq(operatorAggregatorsTable.countryCode, existing.countryCode), eq(operatorAggregatorsTable.operatorName, existing.name)));
    const aggData: any = { updatedAt: new Date() };
    if (aggregatorCode !== undefined) aggData.aggregatorCode = aggregatorCode;
    if (dailyLimit !== undefined) aggData.dailyLimit = String(dailyLimit);
    if (active !== undefined) aggData.active = active;
    if (blockDeposits !== undefined) aggData.blockDeposits = blockDeposits;
    if (blockWithdrawals !== undefined) aggData.blockWithdrawals = blockWithdrawals;
    if (blockApi !== undefined) aggData.blockApi = blockApi;
    if (blockPaymentLinks !== undefined) aggData.blockPaymentLinks = blockPaymentLinks;
    if (maintenanceMode !== undefined) aggData.maintenanceMode = maintenanceMode;
    if (existingAgg) {
      if (name && name !== existing.name) aggData.operatorName = newName;
      if (type && type !== existing.type) aggData.operatorType = newType;
      await db.update(operatorAggregatorsTable).set(aggData).where(eq(operatorAggregatorsTable.id, existingAgg.id));
    } else if (aggregatorCode) {
      await db.insert(operatorAggregatorsTable).values({
        countryCode: existing.countryCode, operatorName: newName, operatorType: newType,
        aggregatorCode, dailyLimit: dailyLimit ?? "1000000", priority: 1,
        active: active ?? true,
        blockDeposits: blockDeposits ?? false, blockWithdrawals: blockWithdrawals ?? false,
        blockApi: blockApi ?? false, blockPaymentLinks: blockPaymentLinks ?? false,
        maintenanceMode: maintenanceMode ?? false,
      });
    }
  }
  await logAdminAction(req.session.userId, "UPDATE_OPERATOR", "operator", String(id), JSON.stringify(data), req.ip);
  res.json({ ok: true });
});

router.post(AP + "/operators/country-toggle", requireAdmin, async (req: any, res: any) => {
  const { countryCode, active } = req.body;
  if (!countryCode || active === undefined) { res.status(400).json({ error: "Missing fields" }); return; }
  await db.update(operatorsTable).set({ active }).where(eq(operatorsTable.countryCode, countryCode));
  await db.update(operatorAggregatorsTable).set({ active, updatedAt: new Date() }).where(eq(operatorAggregatorsTable.countryCode, countryCode));
  await logAdminAction(req.session.userId, active ? "BULK_ACTIVATE" : "BULK_DEACTIVATE", "operator", countryCode, `All operators in ${countryCode}`, req.ip);
  res.json({ ok: true });
});

router.delete(AP + "/operators/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(operatorsTable).where(eq(operatorsTable.id, id));
  if (existing) {
    await db.delete(operatorAggregatorsTable).where(and(
      eq(operatorAggregatorsTable.countryCode, existing.countryCode),
      eq(operatorAggregatorsTable.operatorName, existing.name),
    ));
  }
  await db.delete(operatorsTable).where(eq(operatorsTable.id, id));
  await logAdminAction(req.session.userId, "DELETE_OPERATOR", "operator", String(id), undefined, req.ip);
  res.json({ ok: true });
});

// ─── API KEYS ─────────────────────────────────────────────────────────────────
router.get(AP + "/api-keys", requireAdmin, async (req: any, res: any) => {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const keys = await db.select({
    id: apiKeysTable.id,
    name: apiKeysTable.name,
    description: apiKeysTable.description,
    prefix: apiKeysTable.prefix,
    env: apiKeysTable.env,
    status: apiKeysTable.status,
    lastUsedAt: apiKeysTable.lastUsedAt,
    createdAt: apiKeysTable.createdAt,
    userId: apiKeysTable.userId,
  }).from(apiKeysTable).orderBy(desc(apiKeysTable.createdAt)).limit(limitNum).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(apiKeysTable);

  const userIds = [...new Set(keys.map(k => k.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email })
        .from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  let result = keys.map(k => ({ ...k, merchant: userMap[k.userId] ?? null }));
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(k => k.prefix.toLowerCase().includes(q) || k.name.toLowerCase().includes(q) || (k.merchant?.email ?? "").toLowerCase().includes(q));
  }

  res.json({ keys: result, total: Number(total), page: pageNum, limit: limitNum });
});

router.delete(AP + "/api-keys/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.update(apiKeysTable).set({ status: "revoked" }).where(eq(apiKeysTable.id, id));
  await logAdminAction(req.session.userId, "REVOKE_API_KEY", "api_key", String(id), undefined, req.ip);
  res.json({ ok: true });
});

// ─── API KEY DETAILS (webhooks, IPs, website) ─────────────────────────────────
router.get(AP + "/api-keys/:id/details", requireAdmin, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

    const [key] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.id, id));
    if (!key) { res.status(404).json({ error: "Clé introuvable" }); return; }

    const [user] = await db
      .select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email, country: usersTable.country })
      .from(usersTable).where(eq(usersTable.id, key.userId));

    // website is stored on the KYB submission, not on the user record
    const [kyb] = await db
      .select({ website: kybSubmissionsTable.website })
      .from(kybSubmissionsTable)
      .where(eq(kybSubmissionsTable.userId, key.userId));

    const merchant = user
      ? { ...user, website: kyb?.website ?? null }
      : null;

    const [webhooks, ips] = await Promise.all([
      db.select().from(userWebhooksTable).where(eq(userWebhooksTable.userId, key.userId)),
      db.select().from(userAllowedIpsTable).where(eq(userAllowedIpsTable.userId, key.userId)),
    ]);

    res.json({ key, merchant, webhooks, ips });
  } catch (err: any) {
    console.error("[admin/api-keys/:id/details]", err?.message ?? err);
    res.status(500).json({ error: "Erreur serveur lors du chargement des détails" });
  }
});

// ─── REGENERATE API KEY (admin) ────────────────────────────────────────────────
router.post(AP + "/api-keys/:id/regenerate", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const [old] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.id, id));
  if (!old) { res.status(404).json({ error: "Clé introuvable" }); return; }

  const env = old.env;
  const rawKey = `dp_${env}_sk_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = rawKey.substring(0, env === "sandbox" ? 16 : 12);
  const keyHash = await bcrypt.hash(rawKey, 10);

  await db.update(apiKeysTable).set({ status: "revoked" }).where(eq(apiKeysTable.id, id));

  const [newKey] = await db.insert(apiKeysTable)
    .values({ userId: old.userId, name: old.name, description: old.description, keyHash, rawKey, prefix, env })
    .returning();

  await logAdminAction(req.session.userId, "REGENERATE_API_KEY", "api_key", String(id), JSON.stringify({ oldPrefix: old.prefix, newPrefix: prefix }), req.ip);
  res.json({ ...newKey, rawKey });
});

// ─── BLOCK / UNBLOCK API KEY (admin) ──────────────────────────────────────────
router.patch(AP + "/api-keys/:id/status", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { status } = req.body as { status: "active" | "revoked" };
  if (status !== "active" && status !== "revoked") {
    res.status(400).json({ error: "Statut invalide" }); return;
  }
  await db.update(apiKeysTable).set({ status }).where(eq(apiKeysTable.id, id));
  const action = status === "revoked" ? "REVOKE_API_KEY" : "RESTORE_API_KEY";
  await logAdminAction(req.session.userId, action as any, "api_key", String(id), undefined, req.ip);
  res.json({ ok: true });
});

// ─── PAYMENT LINKS ────────────────────────────────────────────────────────────
router.get(AP + "/payment-links", requireAdmin, async (req: any, res: any) => {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const links = await db.select().from(paymentLinksTable).orderBy(desc(paymentLinksTable.createdAt)).limit(limitNum).offset(offset);
  const [{ total }] = await db.select({ total: count() }).from(paymentLinksTable);

  const userIds = [...new Set(links.map(l => l.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email })
        .from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  let result = links.map(l => ({ ...l, merchant: userMap[l.userId] ?? null }));
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(l => l.title.toLowerCase().includes(q) || l.token.toLowerCase().includes(q));
  }

  res.json({ links: result, total: Number(total), page: pageNum, limit: limitNum });
});

router.delete(AP + "/payment-links/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.delete(paymentLinksTable).where(eq(paymentLinksTable.id, id));
  await logAdminAction(req.session.userId, "DELETE_PAYMENT_LINK", "payment_link", String(id), undefined, req.ip);
  res.json({ ok: true });
});

router.put(AP + "/payment-links/:id/suspend", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.update(paymentLinksTable).set({ status: "inactive" }).where(eq(paymentLinksTable.id, id));
  await logAdminAction(req.session.userId, "SUSPEND_PAYMENT_LINK", "payment_link", String(id), undefined, req.ip);
  res.json({ ok: true });
});

// ─── LOGS ─────────────────────────────────────────────────────────────────────
router.get(AP + "/logs", requireAdmin, async (req: any, res: any) => {
  const { page = "1", limit = "50", action } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (action && action !== "all") conditions.push(eq(adminLogsTable.action, action));
  const where = conditions.length ? and(...conditions) : undefined;

  const logs = await db.select().from(adminLogsTable)
    .where(where)
    .orderBy(desc(adminLogsTable.createdAt))
    .limit(limitNum).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(adminLogsTable).where(where);

  const adminIds = [...new Set(logs.map(l => l.adminId))];
  const admins = adminIds.length > 0
    ? await db.select({ id: usersTable.id, email: usersTable.email, companyName: usersTable.companyName })
        .from(usersTable).where(inArray(usersTable.id, adminIds))
    : [];
  const adminMap = Object.fromEntries(admins.map(a => [a.id, a]));

  res.json({ logs: logs.map(l => ({ ...l, admin: adminMap[l.adminId] ?? null })), total: Number(total), page: pageNum, limit: limitNum });
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
router.get(AP + "/settings", requireAdmin, async (_req: any, res: any) => {
  const settings = await db.select().from(adminSettingsTable);
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  res.json(map);
});

router.put(AP + "/settings", requireAdmin, async (req: any, res: any) => {
  const updates = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    await db.insert(adminSettingsTable).values({ key, value }).onConflictDoUpdate({ target: adminSettingsTable.key, set: { value, updatedAt: new Date() } });
  }
  await logAdminAction(req.session.userId, "UPDATE_SETTINGS", "settings", undefined, JSON.stringify(Object.keys(updates)), req.ip);
  res.json({ ok: true });
});

// ─── LISTE NOIRE (Blacklist) ───────────────────────────────────────────────────
router.get(AP + "/blacklist", requireAdmin, async (req: any, res: any) => {
  const { search = "", page = "1", limit = "50" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let rows = await db
    .select({
      id: blacklistedPhonesTable.id,
      phone: blacklistedPhonesTable.phone,
      reason: blacklistedPhonesTable.reason,
      blockedBy: blacklistedPhonesTable.blockedBy,
      createdAt: blacklistedPhonesTable.createdAt,
      adminEmail: usersTable.email,
    })
    .from(blacklistedPhonesTable)
    .leftJoin(usersTable, eq(blacklistedPhonesTable.blockedBy, usersTable.id))
    .orderBy(desc(blacklistedPhonesTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(r =>
      r.phone.toLowerCase().includes(q) ||
      (r.reason ?? "").toLowerCase().includes(q)
    );
  }

  const [{ total }] = await db.select({ total: count() }).from(blacklistedPhonesTable);
  res.json({ items: rows, total: Number(total), page: pageNum, limit: limitNum });
});

router.post(AP + "/blacklist", requireAdmin, async (req: any, res: any) => {
  const schema = z.object({
    phone: z.string().regex(/^\+?[\d][\d\s\-().]{6,19}$/, "Numéro de téléphone invalide"),
    reason: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Numéro invalide", details: parsed.error.flatten() });
    return;
  }

  const normalized = parsed.data.phone.replace(/\s+/g, "").trim();

  try {
    const [created] = await db
      .insert(blacklistedPhonesTable)
      .values({ phone: normalized, reason: parsed.data.reason ?? null, blockedBy: req.session.userId })
      .returning();
    await logAdminAction(req.session.userId, "BLACKLIST_ADD", "blacklist", normalized, parsed.data.reason, req.ip);

    // Telegram notification
    const [admin] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.session.userId));
    notifyBlacklist("added", normalized, parsed.data.reason, admin?.email).catch(() => {});

    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Ce numéro est déjà dans la liste noire." });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
});

router.delete(AP + "/blacklist/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const [row] = await db.select().from(blacklistedPhonesTable).where(eq(blacklistedPhonesTable.id, id));
  if (!row) { res.status(404).json({ error: "Entrée introuvable" }); return; }
  await db.delete(blacklistedPhonesTable).where(eq(blacklistedPhonesTable.id, id));
  await logAdminAction(req.session.userId, "BLACKLIST_REMOVE", "blacklist", row.phone, undefined, req.ip);

  // Telegram notification
  const [admin] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.session.userId));
  notifyBlacklist("removed", row.phone, undefined, admin?.email).catch(() => {});

  res.json({ ok: true });
});

// ─── TELEGRAM CONFIG ───────────────────────────────────────────────────────────
router.post(AP + "/telegram/test", requireAdmin, async (req: any, res: any) => {
  const { token, chatId } = req.body as { token: string; chatId: string };
  if (!token || !chatId) {
    res.status(400).json({ error: "token et chatId requis" }); return;
  }
  const result = await testConnection(token.trim(), chatId.trim());
  res.json(result);
});

router.get(AP + "/telegram/detect", requireAdmin, async (req: any, res: any) => {
  const token = (req.query.token as string) ?? "";
  if (!token) { res.status(400).json({ error: "token requis" }); return; }
  const result = await detectChatId(token.trim());
  res.json(result);
});

// ─── PAYMENT LINK ATTEMPTS ────────────────────────────────────────────────────
router.get(AP + "/attempts", requireAdmin, async (req: any, res: any) => {
  const { page = "1", limit = "50", status, search } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (status && status !== "all") conditions.push(eq(paymentLinkAttemptsTable.status, status));

  const where = conditions.length ? and(...conditions) : undefined;

  let attempts = await db
    .select({
      id: paymentLinkAttemptsTable.id,
      paymentLinkId: paymentLinkAttemptsTable.paymentLinkId,
      merchantId: paymentLinkAttemptsTable.merchantId,
      phone: paymentLinkAttemptsTable.phone,
      amount: paymentLinkAttemptsTable.amount,
      name: paymentLinkAttemptsTable.name,
      email: paymentLinkAttemptsTable.email,
      countryCode: paymentLinkAttemptsTable.countryCode,
      operator: paymentLinkAttemptsTable.operator,
      status: paymentLinkAttemptsTable.status,
      transactionReference: paymentLinkAttemptsTable.transactionReference,
      note: paymentLinkAttemptsTable.note,
      ipAddress: paymentLinkAttemptsTable.ipAddress,
      createdAt: paymentLinkAttemptsTable.createdAt,
      linkTitle: paymentLinksTable.title,
      merchantName: usersTable.companyName,
      merchantEmail: usersTable.email,
    })
    .from(paymentLinkAttemptsTable)
    .leftJoin(paymentLinksTable, eq(paymentLinkAttemptsTable.paymentLinkId, paymentLinksTable.id))
    .leftJoin(usersTable, eq(paymentLinkAttemptsTable.merchantId, usersTable.id))
    .where(where)
    .orderBy(desc(paymentLinkAttemptsTable.createdAt))
    .limit(limitNum).offset(offset);

  if (search) {
    const q = search.toLowerCase();
    attempts = attempts.filter(a =>
      a.phone.toLowerCase().includes(q) ||
      (a.merchantName ?? "").toLowerCase().includes(q) ||
      (a.name ?? "").toLowerCase().includes(q) ||
      (a.email ?? "").toLowerCase().includes(q) ||
      (a.transactionReference ?? "").toLowerCase().includes(q)
    );
  }

  const [{ total }] = await db.select({ total: count() }).from(paymentLinkAttemptsTable).where(where);

  res.json({ attempts, total: Number(total), page: pageNum, limit: limitNum });
});

router.patch(AP + "/attempts/:id/note", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { note } = req.body as { note: string };
  const [updated] = await db
    .update(paymentLinkAttemptsTable)
    .set({ note: note ?? null, updatedAt: new Date() })
    .where(eq(paymentLinkAttemptsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Tentative introuvable." }); return; }
  res.json({ ok: true });
});

// ─── BROADCAST EMAIL ──────────────────────────────────────────────────────────
router.get(AP + "/broadcast/recipients", requireAdmin, async (req: any, res: any) => {
  const { filter = "all" } = req.query as Record<string, string>;
  let users = await db.select({ id: usersTable.id, email: usersTable.email, companyName: usersTable.companyName, country: usersTable.country, createdAt: usersTable.createdAt })
    .from(usersTable).where(eq(usersTable.role, "user")).orderBy(usersTable.companyName);
  if (filter === "kyb_approved") {
    const kybs = await db.select({ userId: kybSubmissionsTable.userId }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.status, "approved"));
    const ids = new Set(kybs.map(k => k.userId));
    users = users.filter(u => ids.has(u.id));
  } else if (filter === "kyb_pending") {
    const kybs = await db.select({ userId: kybSubmissionsTable.userId }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.status, "pending"));
    const ids = new Set(kybs.map(k => k.userId));
    users = users.filter(u => ids.has(u.id));
  } else if (filter === "no_kyb") {
    const kybs = await db.select({ userId: kybSubmissionsTable.userId }).from(kybSubmissionsTable);
    const ids = new Set(kybs.map(k => k.userId));
    users = users.filter(u => !ids.has(u.id));
  }
  res.json({ recipients: users, total: users.length });
});

router.post(AP + "/message/individual", requireAdmin, async (req: any, res: any) => {
  const { email, subject, body } = req.body as { email?: string; subject?: string; body?: string };
  if (!email?.trim() || !subject?.trim() || !body?.trim()) {
    res.status(400).json({ error: "Email, sujet et message sont requis." });
    return;
  }

  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, companyName: usersTable.companyName })
    .from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase()));

  const merchantName = user?.companyName ?? email.trim();
  const htmlBody = /<[a-z][\s\S]*>/i.test(body) ? body : body.replace(/\n/g, "<br>");

  const result = await sendBroadcastEmail({
    to: email.trim(),
    merchantName,
    subject: subject.trim(),
    htmlBody,
  });

  if (result.ok) {
    await logAdminAction(req.session.userId, "SEND_INDIVIDUAL_EMAIL", "user", user ? String(user.id) : undefined, JSON.stringify({ email: email.trim(), subject }), req.ip);
    res.json({ ok: true });
  } else {
    res.status(500).json({ error: result.error ?? "Échec de l'envoi." });
  }
});

router.get(AP + "/merchants/search", requireAdmin, async (req: any, res: any) => {
  const { q = "" } = req.query as Record<string, string>;
  if (q.trim().length < 2) { res.json({ merchants: [] }); return; }
  const term = `%${q.toLowerCase()}%`;
  const merchants = await db.select({ id: usersTable.id, email: usersTable.email, companyName: usersTable.companyName, country: usersTable.country })
    .from(usersTable)
    .where(and(
      eq(usersTable.role, "user"),
      or(ilike(usersTable.email, term), ilike(usersTable.companyName, term))
    ))
    .limit(8);
  res.json({ merchants });
});

router.post(AP + "/broadcast", requireAdmin, async (req: any, res: any) => {
  const { subject, body, filter = "all" } = req.body as { subject?: string; body?: string; filter?: string };
  if (!subject?.trim() || !body?.trim()) {
    res.status(400).json({ error: "Sujet et message requis." });
    return;
  }

  let users = await db.select({ id: usersTable.id, email: usersTable.email, companyName: usersTable.companyName })
    .from(usersTable).where(eq(usersTable.role, "user"));

  if (filter === "kyb_approved") {
    const kybs = await db.select({ userId: kybSubmissionsTable.userId }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.status, "approved"));
    const ids = new Set(kybs.map(k => k.userId));
    users = users.filter(u => ids.has(u.id));
  } else if (filter === "kyb_pending") {
    const kybs = await db.select({ userId: kybSubmissionsTable.userId }).from(kybSubmissionsTable).where(eq(kybSubmissionsTable.status, "pending"));
    const ids = new Set(kybs.map(k => k.userId));
    users = users.filter(u => ids.has(u.id));
  } else if (filter === "no_kyb") {
    const kybs = await db.select({ userId: kybSubmissionsTable.userId }).from(kybSubmissionsTable);
    const ids = new Set(kybs.map(k => k.userId));
    users = users.filter(u => !ids.has(u.id));
  }

  if (users.length === 0) {
    res.json({ ok: true, sent: 0, failed: 0, errors: [], quotaExceeded: false, remaining: [] });
    return;
  }

  const htmlBody = /<[a-z][\s\S]*>/i.test(body) ? body : body.replace(/\n/g, "<br>");
  let sent = 0; let failed = 0;
  const errors: string[] = [];
  const remaining: { email: string; companyName: string }[] = [];
  let quotaExceeded = false;

  for (const u of users) {
    // Once quota is hit, collect the rest without attempting to send
    if (quotaExceeded) {
      remaining.push({ email: u.email, companyName: u.companyName });
      continue;
    }

    const result = await sendBroadcastEmail({
      to: u.email,
      merchantName: u.companyName,
      subject: subject.trim(),
      htmlBody,
    });

    if (result.ok) {
      sent++;
    } else if (result.quotaExceeded) {
      quotaExceeded = true;
      remaining.push({ email: u.email, companyName: u.companyName });
    } else {
      failed++;
      errors.push(`${u.email}: ${result.error}`);
    }
  }

  await logAdminAction(req.session.userId, "BROADCAST_EMAIL", "users", undefined,
    JSON.stringify({ subject, filter, sent, failed, quotaExceeded, remainingCount: remaining.length }), req.ip);

  res.json({ ok: true, sent, failed, errors, quotaExceeded, remaining });
});

// ── Resume broadcast via Resend after Brevo quota ─────────────────────────────
router.post(AP + "/broadcast/resume-resend", requireAdmin, async (req: any, res: any) => {
  const { recipients, subject, body } = req.body as {
    recipients?: { email: string; companyName: string }[];
    subject?: string;
    body?: string;
  };

  if (!Array.isArray(recipients) || recipients.length === 0) {
    res.status(400).json({ error: "recipients requis." }); return;
  }
  if (!subject?.trim() || !body?.trim()) {
    res.status(400).json({ error: "subject et body requis." }); return;
  }

  const htmlBody = /<[a-z][\s\S]*>/i.test(body) ? body : body.replace(/\n/g, "<br>");
  let sent = 0; let failed = 0; const errors: string[] = [];

  for (const u of recipients) {
    const result = await sendBroadcastEmail({
      to: u.email,
      merchantName: u.companyName,
      subject: subject.trim(),
      htmlBody,
      provider: "resend",
    });
    if (result.ok) sent++;
    else { failed++; errors.push(`${u.email}: ${result.error}`); }
  }

  await logAdminAction(req.session.userId, "BROADCAST_EMAIL_RESUME_RESEND", "users", undefined,
    JSON.stringify({ subject, sent, failed }), req.ip);

  res.json({ ok: true, sent, failed, errors });
});

// ── Social Links ─────────────────────────────────────────────────────────────

router.get(AP + "/social-links", requireAdmin, async (req: any, res: any) => {
  const rows = await db.select().from(socialLinksTable).orderBy(asc(socialLinksTable.sortOrder), asc(socialLinksTable.id));
  res.json(rows);
});

router.post(AP + "/social-links", requireAdmin, async (req: any, res: any) => {
  const { name, platform, url, description, sortOrder } = req.body as {
    name?: string; platform?: string; url?: string; description?: string; sortOrder?: number;
  };
  if (!name?.trim() || !platform?.trim() || !url?.trim()) {
    res.status(400).json({ error: "name, platform et url sont requis" });
    return;
  }
  const [row] = await db.insert(socialLinksTable).values({
    name: name.trim(),
    platform: platform.trim(),
    url: url.trim(),
    description: description?.trim() || null,
    sortOrder: sortOrder ?? 0,
  }).returning();
  await logAdminAction(req.session.userId, "CREATE_SOCIAL_LINK", "social_link", String(row.id), name, req.ip);
  res.json(row);
});

router.put(AP + "/social-links/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id, 10);
  const { name, platform, url, description, sortOrder } = req.body as {
    name?: string; platform?: string; url?: string; description?: string; sortOrder?: number;
  };
  if (!name?.trim() || !platform?.trim() || !url?.trim()) {
    res.status(400).json({ error: "name, platform et url sont requis" });
    return;
  }
  const [row] = await db.update(socialLinksTable)
    .set({ name: name.trim(), platform: platform.trim(), url: url.trim(), description: description?.trim() || null, sortOrder: sortOrder ?? 0, updatedAt: new Date() })
    .where(eq(socialLinksTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Non trouvé" }); return; }
  await logAdminAction(req.session.userId, "UPDATE_SOCIAL_LINK", "social_link", String(id), name, req.ip);
  res.json(row);
});

router.patch(AP + "/social-links/:id/toggle", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id, 10);
  const [current] = await db.select().from(socialLinksTable).where(eq(socialLinksTable.id, id));
  if (!current) { res.status(404).json({ error: "Non trouvé" }); return; }
  const [row] = await db.update(socialLinksTable)
    .set({ active: !current.active, updatedAt: new Date() })
    .where(eq(socialLinksTable.id, id))
    .returning();
  await logAdminAction(req.session.userId, row.active ? "ENABLE_SOCIAL_LINK" : "DISABLE_SOCIAL_LINK", "social_link", String(id), current.name, req.ip);
  res.json(row);
});

router.delete(AP + "/social-links/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id, 10);
  const [deleted] = await db.delete(socialLinksTable).where(eq(socialLinksTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Non trouvé" }); return; }
  await logAdminAction(req.session.userId, "DELETE_SOCIAL_LINK", "social_link", String(id), deleted.name, req.ip);
  res.json({ ok: true });
});

// ── Jobs (Careers) ──────────────────────────────────────────────────────────

function slugify(input: string): string {
  return input
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

router.get(AP + "/jobs", requireAdmin, async (req: any, res: any) => {
  const rows = await db.select().from(jobsTable).orderBy(desc(jobsTable.postedAt));
  res.json(rows);
});

router.post(AP + "/jobs", requireAdmin, async (req: any, res: any) => {
  const { title, slug, department, location, type, remote, description, requirements, responsibilities, applyUrl, active } = req.body as {
    title?: string; slug?: string; department?: string; location?: string; type?: string; remote?: boolean;
    description?: string; requirements?: string[]; responsibilities?: string[]; applyUrl?: string; active?: boolean;
  };
  if (!title?.trim() || !department?.trim() || !location?.trim() || !description?.trim()) {
    res.status(400).json({ error: "title, department, location et description sont requis" });
    return;
  }
  const finalSlug = slug?.trim() ? slugify(slug.trim()) : null;
  if (finalSlug) {
    const [existing] = await db.select({ id: jobsTable.id }).from(jobsTable).where(eq(jobsTable.slug, finalSlug));
    if (existing) { res.status(400).json({ error: "Ce lien personnalisé est déjà utilisé par une autre offre" }); return; }
  }
  const [row] = await db.insert(jobsTable).values({
    title: title.trim(),
    slug: finalSlug,
    department: department.trim(),
    location: location.trim(),
    type: (type as any) || "full-time",
    remote: remote ?? true,
    description: description.trim(),
    requirements: (requirements ?? []).filter((r) => r?.trim()).map((r) => r.trim()),
    responsibilities: (responsibilities ?? []).filter((r) => r?.trim()).map((r) => r.trim()),
    applyUrl: applyUrl?.trim() || null,
    active: active ?? true,
  }).returning();
  await logAdminAction(req.session.userId, "CREATE_JOB", "job", String(row.id), title, req.ip);
  res.json(row);
});

router.put(AP + "/jobs/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id, 10);
  const { title, slug, department, location, type, remote, description, requirements, responsibilities, applyUrl, active } = req.body as {
    title?: string; slug?: string; department?: string; location?: string; type?: string; remote?: boolean;
    description?: string; requirements?: string[]; responsibilities?: string[]; applyUrl?: string; active?: boolean;
  };
  if (!title?.trim() || !department?.trim() || !location?.trim() || !description?.trim()) {
    res.status(400).json({ error: "title, department, location et description sont requis" });
    return;
  }
  const finalSlug = slug?.trim() ? slugify(slug.trim()) : null;
  if (finalSlug) {
    const [existing] = await db.select({ id: jobsTable.id }).from(jobsTable).where(eq(jobsTable.slug, finalSlug));
    if (existing && existing.id !== id) { res.status(400).json({ error: "Ce lien personnalisé est déjà utilisé par une autre offre" }); return; }
  }
  const [row] = await db.update(jobsTable)
    .set({
      title: title.trim(),
      slug: finalSlug,
      department: department.trim(),
      location: location.trim(),
      type: (type as any) || "full-time",
      remote: remote ?? true,
      description: description.trim(),
      requirements: (requirements ?? []).filter((r) => r?.trim()).map((r) => r.trim()),
      responsibilities: (responsibilities ?? []).filter((r) => r?.trim()).map((r) => r.trim()),
      applyUrl: applyUrl?.trim() || null,
      active: active ?? true,
    })
    .where(eq(jobsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Non trouvé" }); return; }
  await logAdminAction(req.session.userId, "UPDATE_JOB", "job", String(id), title, req.ip);
  res.json(row);
});

router.patch(AP + "/jobs/:id/toggle", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id, 10);
  const [current] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!current) { res.status(404).json({ error: "Non trouvé" }); return; }
  const [row] = await db.update(jobsTable)
    .set({ active: !current.active })
    .where(eq(jobsTable.id, id))
    .returning();
  await logAdminAction(req.session.userId, row.active ? "ENABLE_JOB" : "DISABLE_JOB", "job", String(id), current.title, req.ip);
  res.json(row);
});

router.delete(AP + "/jobs/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id, 10);
  const [deleted] = await db.delete(jobsTable).where(eq(jobsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Non trouvé" }); return; }
  await logAdminAction(req.session.userId, "DELETE_JOB", "job", String(id), deleted.title, req.ip);
  res.json({ ok: true });
});

router.post(AP + "/telegram/save", requireAdmin, async (req: any, res: any) => {
  const { token, chatId } = req.body as { token?: string; chatId?: string };
  const updates: Record<string, string> = {};
  if (token !== undefined) updates["telegram_bot_token"] = token.trim();
  if (chatId !== undefined) updates["telegram_chat_id"] = chatId.trim();
  for (const [key, value] of Object.entries(updates)) {
    await db.insert(adminSettingsTable).values({ key, value })
      .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value, updatedAt: new Date() } });
  }
  invalidateTelegramCache();
  await logAdminAction(req.session.userId, "UPDATE_TELEGRAM_CONFIG", "settings", undefined, undefined, req.ip);
  res.json({ ok: true });
});

// ─── Support Agents Management ───────────────────────────────────────────────

router.get(AP + "/support-agents", requireAdmin, async (req, res) => {
  const agents = await db
    .select({
      id: supportUsersTable.id,
      email: supportUsersTable.email,
      name: supportUsersTable.name,
      mustChangePassword: supportUsersTable.mustChangePassword,
      createdAt: supportUsersTable.createdAt,
    })
    .from(supportUsersTable)
    .orderBy(asc(supportUsersTable.createdAt));
  res.json({ agents });
});

router.post(AP + "/support-agents", requireAdmin, async (req, res) => {
  const schema = z.object({
    email: z.string().email("Email invalide"),
    name: z.string().min(2, "Nom requis"),
    password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    return;
  }
  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  const [existing] = await db.select({ id: supportUsersTable.id }).from(supportUsersTable).where(eq(sql`lower(${supportUsersTable.email})`, email));
  if (existing) {
    res.status(409).json({ error: "Un agent avec cet email existe déjà" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [agent] = await db.insert(supportUsersTable).values({
    email,
    name,
    passwordHash,
    mustChangePassword: true,
  }).returning({ id: supportUsersTable.id, email: supportUsersTable.email, name: supportUsersTable.name });

  await logAdminAction(req.session.userId!, "CREATE_SUPPORT_AGENT", "support_user", String(agent.id), `Created support agent: ${email}`, req.ip);
  res.status(201).json({ success: true, agent });
});

router.patch(AP + "/support-agents/:id/reset-password", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const schema = z.object({ newPassword: z.string().min(8, "Mot de passe : 8 caractères minimum") });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    return;
  }

  const [agent] = await db.select({ id: supportUsersTable.id }).from(supportUsersTable).where(eq(supportUsersTable.id, id));
  if (!agent) { res.status(404).json({ error: "Agent introuvable" }); return; }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(supportUsersTable)
    .set({ passwordHash, mustChangePassword: true })
    .where(eq(supportUsersTable.id, id));

  await logAdminAction(req.session.userId!, "RESET_SUPPORT_AGENT_PASSWORD", "support_user", String(id), undefined, req.ip);
  res.json({ success: true });
});

router.delete(AP + "/support-agents/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [agent] = await db.select({ id: supportUsersTable.id, email: supportUsersTable.email }).from(supportUsersTable).where(eq(supportUsersTable.id, id));
  if (!agent) { res.status(404).json({ error: "Agent introuvable" }); return; }

  await db.delete(supportUsersTable).where(eq(supportUsersTable.id, id));
  await logAdminAction(req.session.userId!, "DELETE_SUPPORT_AGENT", "support_user", String(id), `Deleted: ${agent.email}`, req.ip);
  res.json({ success: true });
});

// ─── Global Banners ───────────────────────────────────────────────────────────

const bannerImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"].includes(file.mimetype);
    cb(null, ok);
  },
});

router.get(AP + "/global-banners", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(globalBannersTable).orderBy(desc(globalBannersTable.createdAt));
  res.json(rows);
});

router.post(AP + "/global-banners/upload-image", requireAdmin, bannerImageUpload.single("image"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "Aucun fichier reçu" }); return; }
  try {
    const publicUrl = await uploadBannerImage(req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json({ url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Échec upload" });
  }
});

const bannerCreateSchema = z.object({
  message: z.string().min(1).max(500),
  color: z.string().default("blue"),
  customColor: z.string().optional(),
  buttonText: z.string().max(60).optional(),
  buttonLink: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().default(true),
});

router.post(AP + "/global-banners", requireAdmin, async (req, res) => {
  const parsed = bannerCreateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const [banner] = await db.insert(globalBannersTable).values({
    ...parsed.data,
    createdById: req.session.userId,
  }).returning();
  await logAdminAction(req.session.userId!, "CREATE_BANNER", "global_banner", String(banner.id), parsed.data.message, req.ip);
  res.json(banner);
});

router.patch(AP + "/global-banners/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select().from(globalBannersTable).where(eq(globalBannersTable.id, id));
  if (!existing) { res.status(404).json({ error: "Bannière introuvable" }); return; }
  const parsed = bannerCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const [updated] = await db.update(globalBannersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(globalBannersTable.id, id))
    .returning();
  await logAdminAction(req.session.userId!, "UPDATE_BANNER", "global_banner", String(id), parsed.data.message, req.ip);
  res.json(updated);
});

router.patch(AP + "/global-banners/:id/toggle", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select().from(globalBannersTable).where(eq(globalBannersTable.id, id));
  if (!existing) { res.status(404).json({ error: "Bannière introuvable" }); return; }
  const [updated] = await db.update(globalBannersTable)
    .set({ active: !existing.active, updatedAt: new Date() })
    .where(eq(globalBannersTable.id, id))
    .returning();
  await logAdminAction(req.session.userId!, updated.active ? "ENABLE_BANNER" : "DISABLE_BANNER", "global_banner", String(id), undefined, req.ip);
  res.json(updated);
});

router.delete(AP + "/global-banners/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select({ id: globalBannersTable.id }).from(globalBannersTable).where(eq(globalBannersTable.id, id));
  if (!existing) { res.status(404).json({ error: "Bannière introuvable" }); return; }
  await db.delete(globalBannersTable).where(eq(globalBannersTable.id, id));
  await logAdminAction(req.session.userId!, "DELETE_BANNER", "global_banner", String(id), undefined, req.ip);
  res.json({ success: true });
});

export default router;
