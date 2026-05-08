import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  usersTable, transactionsTable, walletsTable, kybSubmissionsTable,
  apiKeysTable, paymentLinksTable, operatorsTable, countriesTable,
  aggregatorsTable, operatorAggregatorsTable, adminLogsTable, adminSettingsTable,
} from "@workspace/db/schema";
import { eq, and, desc, sum, count, sql, ilike, or, gte, lt } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.session?.role !== "admin") {
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
router.get("/admin/stats", requireAdmin, async (req: any, res: any) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

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
      .where(and(gte(transactionsTable.createdAt, today), lt(transactionsTable.createdAt, tomorrow)))
      .groupBy(transactionsTable.type),
    db.select({
      type: transactionsTable.type,
      status: transactionsTable.status,
      mode: transactionsTable.mode,
      total: sum(transactionsTable.amount),
      fees: sum(transactionsTable.fee),
      cnt: count(),
    }).from(transactionsTable).groupBy(transactionsTable.type, transactionsTable.status, transactionsTable.mode),
    db.select().from(transactionsTable)
      .where(sql`${transactionsTable.amount}::numeric > 60000`)
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
    }).from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(10),
    db.selectDistinct({ domain: transactionsTable.webhookUrl })
      .from(transactionsTable)
      .where(sql`${transactionsTable.webhookUrl} IS NOT NULL AND ${transactionsTable.webhookUrl} != ''`),
  ]);

  const merchantIds = [...new Set(recentTx.map(t => t.userId))];
  const merchants = merchantIds.length > 0
    ? await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email })
        .from(usersTable).where(sql`${usersTable.id} = ANY(ARRAY[${sql.raw(merchantIds.join(","))}]::int[])`)
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

  const totalFeesAll = txAll.reduce((a, t) => a + parseFloat(String(t.fees ?? 0)), 0);
  const totalPayinVol = txAll.filter(t => t.type === "payin").reduce((a, t) => a + parseFloat(String(t.total ?? 0)), 0);
  const totalPayoutVol = txAll.filter(t => t.type === "payout").reduce((a, t) => a + parseFloat(String(t.total ?? 0)), 0);
  const totalTxVolume = totalPayinVol + totalPayoutVol;

  // Live mode (API) vs sandbox
  const liveTx = txAll.filter(t => t.mode === "live");
  const sandboxTx = txAll.filter(t => t.mode === "sandbox");
  const livePayinVol = liveTx.filter(t => t.type === "payin").reduce((a, t) => a + parseFloat(String(t.total ?? 0)), 0);
  const livePayoutVol = liveTx.filter(t => t.type === "payout").reduce((a, t) => a + parseFloat(String(t.total ?? 0)), 0);
  const liveFees = liveTx.reduce((a, t) => a + parseFloat(String(t.fees ?? 0)), 0);
  const liveCount = liveTx.reduce((a, t) => a + Number(t.cnt), 0);
  const sandboxCount = sandboxTx.reduce((a, t) => a + Number(t.cnt), 0);

  // Domains using the API (extracted from webhook URLs)
  const domains = domainesRaw
    .map(r => { try { return new URL(r.domain ?? "").hostname; } catch { return null; } })
    .filter((d): d is string => !!d);
  const uniqueDomains = [...new Set(domains)];

  const platformBalance = parseFloat(String(soldePlateforme[0]?.total ?? 0));

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
  });
});

// ─── CHART DATA ───────────────────────────────────────────────────────────────
router.get("/admin/chart-data", requireAdmin, async (_req: any, res: any) => {
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
      .where(and(gte(transactionsTable.createdAt, d), lt(transactionsTable.createdAt, next), eq(transactionsTable.status, "success")))
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
router.get("/admin/merchants", requireAdmin, async (req: any, res: any) => {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limitNum).offset(offset);
  if (search) {
    const q = search.toLowerCase();
    users = users.filter(u => u.email.toLowerCase().includes(q) || u.companyName.toLowerCase().includes(q));
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

router.get("/admin/merchants/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, id));
  const [kyb] = await db.select().from(kybSubmissionsTable).where(eq(kybSubmissionsTable.userId, id));
  const apiKeys = await db.select({ id: apiKeysTable.id, name: apiKeysTable.name, prefix: apiKeysTable.prefix, env: apiKeysTable.env, status: apiKeysTable.status, createdAt: apiKeysTable.createdAt })
    .from(apiKeysTable).where(eq(apiKeysTable.userId, id));
  const recentTx = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, id)).orderBy(desc(transactionsTable.createdAt)).limit(20);
  res.json({ ...user, passwordHash: undefined, wallets, kyb, apiKeys, recentTransactions: recentTx });
});

router.put("/admin/merchants/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { companyName, email, country, role } = req.body;
  const updateData: any = {};
  if (companyName) updateData.companyName = companyName;
  if (email) updateData.email = email;
  if (country) updateData.country = country;
  if (role && ["admin", "user"].includes(role)) updateData.role = role;
  await db.update(usersTable).set(updateData).where(eq(usersTable.id, id));
  await logAdminAction(req.session.userId, "UPDATE_MERCHANT", "user", String(id), JSON.stringify(updateData), req.ip);
  res.json({ ok: true });
});

router.put("/admin/merchants/:id/role", requireAdmin, async (req: any, res: any) => {
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

router.post("/admin/merchants/:id/suspend", requireAdmin, async (req: any, res: any) => {
  res.json({ ok: true, message: "Compte suspendu (flag non implémenté en DB, logué)" });
  await logAdminAction(req.session.userId, "SUSPEND_MERCHANT", "user", req.params.id, undefined, req.ip);
});

router.post("/admin/merchants/:id/activate", requireAdmin, async (req: any, res: any) => {
  res.json({ ok: true, message: "Compte réactivé" });
  await logAdminAction(req.session.userId, "ACTIVATE_MERCHANT", "user", req.params.id, undefined, req.ip);
});

router.post("/admin/merchants/:id/reset-password", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const newPassword = crypto.randomBytes(8).toString("hex");
  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, id));
  await logAdminAction(req.session.userId, "RESET_PASSWORD", "user", String(id), undefined, req.ip);
  res.json({ ok: true, newPassword });
});

router.delete("/admin/merchants/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (id === req.session.userId) { res.status(400).json({ error: "Cannot delete yourself" }); return; }
  await logAdminAction(req.session.userId, "DELETE_MERCHANT", "user", String(id), undefined, req.ip);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

router.put("/admin/merchants/:userId/wallets/:walletId", requireAdmin, async (req: any, res: any) => {
  const walletId = parseInt(req.params.walletId);
  const { balance } = req.body;
  if (balance === undefined || isNaN(parseFloat(balance))) { res.status(400).json({ error: "Invalid balance" }); return; }
  await db.update(walletsTable).set({ balance: String(parseFloat(balance)) }).where(eq(walletsTable.id, walletId));
  await logAdminAction(req.session.userId, "EDIT_WALLET_BALANCE", "wallet", String(walletId), `New balance: ${balance}`, req.ip);
  res.json({ ok: true });
});

// ─── KYB ─────────────────────────────────────────────────────────────────────
router.get("/admin/kyb", requireAdmin, async (req: any, res: any) => {
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
      OR lower(${usersTable.company_name}) LIKE ${q}
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

router.put("/admin/kyb/:id/approve", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.update(kybSubmissionsTable).set({ status: "approved", reviewedAt: new Date() }).where(eq(kybSubmissionsTable.id, id));
  await logAdminAction(req.session.userId, "APPROVE_KYB", "kyb", String(id), undefined, req.ip);
  res.json({ ok: true });
});

router.put("/admin/kyb/:id/reject", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  await db.update(kybSubmissionsTable).set({ status: "rejected", rejectionReason: reason, reviewedAt: new Date() }).where(eq(kybSubmissionsTable.id, id));
  await logAdminAction(req.session.userId, "REJECT_KYB", "kyb", String(id), reason, req.ip);
  res.json({ ok: true });
});

router.put("/admin/kyb/:id/review", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.update(kybSubmissionsTable).set({ status: "under_review" }).where(eq(kybSubmissionsTable.id, id));
  await logAdminAction(req.session.userId, "REVIEW_KYB", "kyb", String(id), undefined, req.ip);
  res.json({ ok: true });
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
router.get("/admin/transactions", requireAdmin, async (req: any, res: any) => {
  const { type, status, countryCode, operator, search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (type && type !== "all") conditions.push(eq(transactionsTable.type, type as any));
  if (status && status !== "all") conditions.push(eq(transactionsTable.status, status as any));
  if (countryCode && countryCode !== "all") conditions.push(eq(transactionsTable.countryCode, countryCode));
  if (operator && operator !== "all") conditions.push(eq(transactionsTable.operator, operator));

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
        .from(usersTable).where(sql`${usersTable.id} = ANY(ARRAY[${sql.raw(userIds.join(","))}]::int[])`)
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json({
    transactions: txs.map(t => ({ ...t, merchant: userMap[t.userId] ?? null })),
    total: Number(total), page: pageNum, limit: limitNum,
  });
});

// ─── WALLETS ──────────────────────────────────────────────────────────────────
router.get("/admin/wallets", requireAdmin, async (_req: any, res: any) => {
  const wallets = await db.select().from(walletsTable).orderBy(walletsTable.countryCode);
  const userIds = [...new Set(wallets.map(w => w.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email })
        .from(usersTable).where(sql`${usersTable.id} = ANY(ARRAY[${sql.raw(userIds.join(","))}]::int[])`)
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

router.post("/admin/wallets/:id/credit", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { amount, note } = req.body;
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }
  await db.update(walletsTable).set({ balance: sql`${walletsTable.balance} + ${parseFloat(amount)}` }).where(eq(walletsTable.id, id));
  await logAdminAction(req.session.userId, "CREDIT_WALLET", "wallet", String(id), `Amount: ${amount}, Note: ${note}`, req.ip);
  res.json({ ok: true });
});

router.post("/admin/wallets/:id/debit", requireAdmin, async (req: any, res: any) => {
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
router.get("/admin/aggregators", requireAdmin, async (_req: any, res: any) => {
  const aggs = await db.select().from(aggregatorsTable).orderBy(aggregatorsTable.name);
  const opAggs = await db.select().from(operatorAggregatorsTable).orderBy(operatorAggregatorsTable.countryCode);
  res.json({ aggregators: aggs, operatorAggregators: opAggs });
});

router.post("/admin/aggregators", requireAdmin, async (req: any, res: any) => {
  const { name, code, description } = req.body;
  if (!name || !code) { res.status(400).json({ error: "name and code required" }); return; }
  const [agg] = await db.insert(aggregatorsTable).values({ name, code, description }).returning();
  await logAdminAction(req.session.userId, "CREATE_AGGREGATOR", "aggregator", agg.code, name, req.ip);
  res.status(201).json(agg);
});

router.put("/admin/aggregators/:id", requireAdmin, async (req: any, res: any) => {
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

router.post("/admin/operator-aggregators", requireAdmin, async (req: any, res: any) => {
  const { countryCode, operatorName, operatorType, aggregatorCode, dailyLimit, priority } = req.body;
  if (!countryCode || !operatorName || !aggregatorCode) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [oa] = await db.insert(operatorAggregatorsTable).values({
    countryCode, operatorName, operatorType: operatorType ?? "mobile-money",
    aggregatorCode, dailyLimit: dailyLimit ?? "1000000", priority: priority ?? 1,
  }).returning();
  await logAdminAction(req.session.userId, "CREATE_OPERATOR_AGG", "operator_aggregator", String(oa.id), `${countryCode}/${operatorName} → ${aggregatorCode}`, req.ip);
  res.status(201).json(oa);
});

router.put("/admin/operator-aggregators/:id", requireAdmin, async (req: any, res: any) => {
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

router.delete("/admin/operator-aggregators/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.delete(operatorAggregatorsTable).where(eq(operatorAggregatorsTable.id, id));
  await logAdminAction(req.session.userId, "DELETE_OPERATOR_AGG", "operator_aggregator", String(id), undefined, req.ip);
  res.json({ ok: true });
});

// ─── OPERATORS ────────────────────────────────────────────────────────────────
router.get("/admin/operators", requireAdmin, async (_req: any, res: any) => {
  const ops = await db.select().from(operatorsTable).orderBy(operatorsTable.countryCode, operatorsTable.name);
  const opAggs = await db.select().from(operatorAggregatorsTable).orderBy(operatorAggregatorsTable.priority);
  const aggs = await db.select().from(aggregatorsTable).where(eq(aggregatorsTable.active, true)).orderBy(aggregatorsTable.name);
  res.json({ operators: ops, operatorAggregators: opAggs, aggregators: aggs });
});

router.post("/admin/operators", requireAdmin, async (req: any, res: any) => {
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

router.put("/admin/operators/:id", requireAdmin, async (req: any, res: any) => {
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

router.post("/admin/operators/country-toggle", requireAdmin, async (req: any, res: any) => {
  const { countryCode, active } = req.body;
  if (!countryCode || active === undefined) { res.status(400).json({ error: "Missing fields" }); return; }
  await db.update(operatorsTable).set({ active }).where(eq(operatorsTable.countryCode, countryCode));
  await db.update(operatorAggregatorsTable).set({ active, updatedAt: new Date() }).where(eq(operatorAggregatorsTable.countryCode, countryCode));
  await logAdminAction(req.session.userId, active ? "BULK_ACTIVATE" : "BULK_DEACTIVATE", "operator", countryCode, `All operators in ${countryCode}`, req.ip);
  res.json({ ok: true });
});

router.delete("/admin/operators/:id", requireAdmin, async (req: any, res: any) => {
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
router.get("/admin/api-keys", requireAdmin, async (req: any, res: any) => {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const keys = await db.select({
    id: apiKeysTable.id,
    name: apiKeysTable.name,
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
        .from(usersTable).where(sql`${usersTable.id} = ANY(ARRAY[${sql.raw(userIds.join(","))}]::int[])`)
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  let result = keys.map(k => ({ ...k, merchant: userMap[k.userId] ?? null }));
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(k => k.prefix.toLowerCase().includes(q) || k.name.toLowerCase().includes(q) || (k.merchant?.email ?? "").toLowerCase().includes(q));
  }

  res.json({ keys: result, total: Number(total), page: pageNum, limit: limitNum });
});

router.delete("/admin/api-keys/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.update(apiKeysTable).set({ status: "revoked" }).where(eq(apiKeysTable.id, id));
  await logAdminAction(req.session.userId, "REVOKE_API_KEY", "api_key", String(id), undefined, req.ip);
  res.json({ ok: true });
});

// ─── PAYMENT LINKS ────────────────────────────────────────────────────────────
router.get("/admin/payment-links", requireAdmin, async (req: any, res: any) => {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const links = await db.select().from(paymentLinksTable).orderBy(desc(paymentLinksTable.createdAt)).limit(limitNum).offset(offset);
  const [{ total }] = await db.select({ total: count() }).from(paymentLinksTable);

  const userIds = [...new Set(links.map(l => l.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, companyName: usersTable.companyName, email: usersTable.email })
        .from(usersTable).where(sql`${usersTable.id} = ANY(ARRAY[${sql.raw(userIds.join(","))}]::int[])`)
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  let result = links.map(l => ({ ...l, merchant: userMap[l.userId] ?? null }));
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(l => l.title.toLowerCase().includes(q) || l.token.toLowerCase().includes(q));
  }

  res.json({ links: result, total: Number(total), page: pageNum, limit: limitNum });
});

router.delete("/admin/payment-links/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.delete(paymentLinksTable).where(eq(paymentLinksTable.id, id));
  await logAdminAction(req.session.userId, "DELETE_PAYMENT_LINK", "payment_link", String(id), undefined, req.ip);
  res.json({ ok: true });
});

router.put("/admin/payment-links/:id/suspend", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  await db.update(paymentLinksTable).set({ status: "inactive" }).where(eq(paymentLinksTable.id, id));
  await logAdminAction(req.session.userId, "SUSPEND_PAYMENT_LINK", "payment_link", String(id), undefined, req.ip);
  res.json({ ok: true });
});

// ─── LOGS ─────────────────────────────────────────────────────────────────────
router.get("/admin/logs", requireAdmin, async (req: any, res: any) => {
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
        .from(usersTable).where(sql`${usersTable.id} = ANY(ARRAY[${sql.raw(adminIds.join(","))}]::int[])`)
    : [];
  const adminMap = Object.fromEntries(admins.map(a => [a.id, a]));

  res.json({ logs: logs.map(l => ({ ...l, admin: adminMap[l.adminId] ?? null })), total: Number(total), page: pageNum, limit: limitNum });
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
router.get("/admin/settings", requireAdmin, async (_req: any, res: any) => {
  const settings = await db.select().from(adminSettingsTable);
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  res.json(map);
});

router.put("/admin/settings", requireAdmin, async (req: any, res: any) => {
  const updates = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    await db.insert(adminSettingsTable).values({ key, value }).onConflictDoUpdate({ target: adminSettingsTable.key, set: { value, updatedAt: new Date() } });
  }
  await logAdminAction(req.session.userId, "UPDATE_SETTINGS", "settings", undefined, JSON.stringify(Object.keys(updates)), req.ip);
  res.json({ ok: true });
});

export default router;
