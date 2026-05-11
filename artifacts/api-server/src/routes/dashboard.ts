import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  walletsTable,
  transactionsTable,
  apiKeysTable,
  kybSubmissionsTable,
  usersTable,
  reversementsTable,
  paymentLinksTable,
  massPayoutJobsTable,
  operatorsTable,
  operatorAggregatorsTable,
  blacklistedPhonesTable,
  paymentLinkAttemptsTable,
} from "@workspace/db/schema";
import { eq, and, desc, sum, count, sql, gte } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import multer from "multer";
import { notifyKybSubmitted, notifyReversement, notifyPayin, notifyAttemptSpam } from "../lib/telegram";
import { sendContractEmail, sendKybProcessingEmail } from "../lib/mailer";
import { sendWhatsAppContractNotification } from "../lib/whatsapp";
import { uploadKybDocument, downloadContractTemplate } from "../lib/storage";

// Memory storage — files go to Supabase, nothing kept on disk
const kybUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const FEE_RATE = 0.03;

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

// ── Live / Sandbox mode ───────────────────────────────────────────────────────

router.get("/dashboard/mode", requireAuth, async (req, res) => {
  if (!req.session.mode) req.session.mode = "sandbox";
  let kybStatus: string = "pending";
  if (req.session.role !== "admin") {
    const userId = req.session.userId!;
    const [kyb] = await db
      .select({ status: kybSubmissionsTable.status })
      .from(kybSubmissionsTable)
      .where(eq(kybSubmissionsTable.userId, userId));
    kybStatus = kyb?.status ?? "pending";
  } else {
    kybStatus = "approved";
  }
  res.json({ mode: req.session.mode, kybStatus });
});

router.post("/dashboard/mode", requireAuth, async (req, res) => {
  const { mode } = req.body as { mode?: string };
  if (mode !== "sandbox" && mode !== "live") {
    res.status(400).json({ error: "Mode invalide. Valeurs acceptées : sandbox, live." });
    return;
  }
  if (mode === "live" && req.session.role !== "admin") {
    const userId = req.session.userId!;
    const [kyb] = await db
      .select({ status: kybSubmissionsTable.status })
      .from(kybSubmissionsTable)
      .where(eq(kybSubmissionsTable.userId, userId));
    if (!kyb || kyb.status !== "approved") {
      res.status(403).json({ error: "KYB_NOT_APPROVED" });
      return;
    }
  }
  req.session.mode = mode;
  res.json({ mode });
});

// ── Operator availability check ───────────────────────────────────────────────
type BlockKind = "deposits" | "withdrawals" | "api" | "paymentLinks";

async function checkOperatorAvailable(
  countryCode: string,
  operatorName: string,
  blockKind: BlockKind,
): Promise<{ ok: false; error: string; status: number } | { ok: true }> {
  const [op] = await db
    .select()
    .from(operatorsTable)
    .where(and(eq(operatorsTable.countryCode, countryCode), eq(operatorsTable.name, operatorName)));

  if (!op || !op.active) {
    return { ok: false, status: 503, error: "Opérateur indisponible pour le moment." };
  }

  const [opAgg] = await db
    .select()
    .from(operatorAggregatorsTable)
    .where(and(
      eq(operatorAggregatorsTable.countryCode, countryCode),
      eq(operatorAggregatorsTable.operatorName, operatorName),
    ));

  if (opAgg) {
    if (opAgg.maintenanceMode) {
      return { ok: false, status: 503, error: "Cet opérateur est actuellement en maintenance. Veuillez réessayer plus tard." };
    }
    if (!opAgg.active) {
      return { ok: false, status: 503, error: "Opérateur indisponible pour le moment." };
    }
    if (blockKind === "deposits" && opAgg.blockDeposits) {
      return { ok: false, status: 503, error: "Les dépôts sont temporairement bloqués pour cet opérateur." };
    }
    if (blockKind === "withdrawals" && opAgg.blockWithdrawals) {
      return { ok: false, status: 503, error: "Les retraits sont temporairement bloqués pour cet opérateur." };
    }
    if (blockKind === "api" && opAgg.blockApi) {
      return { ok: false, status: 503, error: "Les paiements API sont temporairement bloqués pour cet opérateur." };
    }
    if (blockKind === "paymentLinks" && opAgg.blockPaymentLinks) {
      return { ok: false, status: 503, error: "Les liens de paiement sont temporairement bloqués pour cet opérateur." };
    }
  }

  return { ok: true };
}

const COUNTRIES = [
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", currency: "XOF" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF" },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
];

async function getUserFeeRate(userId: number): Promise<number> {
  const [user] = await db.select({ accountType: usersTable.accountType }).from(usersTable).where(eq(usersTable.id, userId));
  return user?.accountType === "personal" ? 0.05 : 0.03;
}

router.get("/dashboard/status", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const [kyb] = await db
    .select({ status: kybSubmissionsTable.status })
    .from(kybSubmissionsTable)
    .where(eq(kybSubmissionsTable.userId, userId));
  res.json({ kybStatus: kyb?.status ?? "pending" });
});

router.get("/dashboard/overview", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const currentMode = (req.session.mode ?? "sandbox") as "sandbox" | "live";

  const wallets = await db.select().from(walletsTable).where(
    and(eq(walletsTable.userId, userId), eq(walletsTable.mode, currentMode))
  );

  const txStats = await db
    .select({
      type: transactionsTable.type,
      status: transactionsTable.status,
      total: sum(transactionsTable.amount),
      totalFees: sum(transactionsTable.fee),
      txCount: count(),
    })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.mode, currentMode)))
    .groupBy(transactionsTable.type, transactionsTable.status);

  const recentTx = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.mode, currentMode)))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(10);

  const kyb = await db
    .select()
    .from(kybSubmissionsTable)
    .where(eq(kybSubmissionsTable.userId, userId))
    .limit(1);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const dailyVolumeRows = await db
    .select({
      day: sql<string>`DATE(${transactionsTable.createdAt})`,
      type: transactionsTable.type,
      total: sum(transactionsTable.amount),
      txCount: count(),
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.status, "success"),
        eq(transactionsTable.mode, currentMode),
        sql`${transactionsTable.createdAt} >= ${thirtyDaysAgo.toISOString()}`
      )
    )
    .groupBy(sql`DATE(${transactionsTable.createdAt})`, transactionsTable.type)
    .orderBy(sql`DATE(${transactionsTable.createdAt})`);

  const dailyMap: Record<string, { payin: number; payout: number; count: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = { payin: 0, payout: 0, count: 0 };
  }
  for (const row of dailyVolumeRows) {
    const key = row.day;
    if (!dailyMap[key]) dailyMap[key] = { payin: 0, payout: 0, count: 0 };
    if (row.type === "payin") dailyMap[key].payin = parseFloat(row.total ?? "0");
    if (row.type === "payout") dailyMap[key].payout = parseFloat(row.total ?? "0");
    dailyMap[key].count += parseInt(String(row.txCount ?? 0));
  }
  const volumeChart = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      label: new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      payin: v.payin,
      payout: v.payout,
      count: v.count,
    }));

  res.json({
    wallets,
    txStats,
    recentTransactions: recentTx,
    kybStatus: kyb[0]?.status ?? "pending",
    volumeChart,
  });
});

router.get("/dashboard/wallets", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const currentMode = (req.session.mode ?? "sandbox") as "sandbox" | "live";
  const wallets = await db.select().from(walletsTable).where(
    and(eq(walletsTable.userId, userId), eq(walletsTable.mode, currentMode))
  );

  const enriched = wallets.map((w) => {
    const country = COUNTRIES.find((c) => c.code === w.countryCode);
    return { ...w, country };
  });

  res.json(enriched);
});

router.get("/dashboard/transactions", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const currentMode = (req.session.mode ?? "sandbox") as "sandbox" | "live";
  const { type, status, countryCode, page = "1", limit = "20" } = req.query as Record<string, string>;

  const conditions: any[] = [eq(transactionsTable.userId, userId), eq(transactionsTable.mode, currentMode)];
  if (type) conditions.push(eq(transactionsTable.type, type as any));
  if (status) conditions.push(eq(transactionsTable.status, status as any));
  if (countryCode) conditions.push(eq(transactionsTable.countryCode, countryCode));

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const txs = await db
    .select()
    .from(transactionsTable)
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(parseInt(limit))
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(transactionsTable)
    .where(and(...conditions));

  res.json({ transactions: txs, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get("/dashboard/payments", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const currentMode = (req.session.mode ?? "sandbox") as "sandbox" | "live";
  const { type, status, search, page = "1", limit = "20" } = req.query as Record<string, string>;

  const conditions: any[] = [eq(transactionsTable.userId, userId), eq(transactionsTable.mode, currentMode)];
  if (type && type !== "all") conditions.push(eq(transactionsTable.type, type as any));
  if (status && status !== "all") conditions.push(eq(transactionsTable.status, status as any));

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let txs = await db
    .select()
    .from(transactionsTable)
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  if (search) {
    const q = search.toLowerCase();
    txs = txs.filter(t =>
      t.reference.toLowerCase().includes(q) ||
      (t.orderId ?? "").toLowerCase().includes(q) ||
      t.phone.toLowerCase().includes(q)
    );
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(transactionsTable)
    .where(and(...conditions));

  res.json({ transactions: txs, total, page: pageNum, limit: limitNum });
});

router.post("/dashboard/transactions/:id/resend-webhook", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const txId = parseInt(req.params.id);

  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, txId), eq(transactionsTable.userId, userId)));

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const webhookUrl = tx.webhookUrl ?? "https://your-server.com/webhook";
  const payload = {
    event: tx.type === "payin" ? "payin." + tx.status : "payout." + tx.status,
    reference: tx.reference,
    order_id: tx.orderId,
    status: tx.status,
    amount: tx.amount,
    fee: tx.fee,
    net_amount: tx.netAmount,
    currency: tx.currency,
    country_code: tx.countryCode,
    operator: tx.operator,
    phone: tx.phone,
    created_at: tx.createdAt,
  };

  let statusCode = 200;
  let body = "";
  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    statusCode = r.status;
    body = await r.text().catch(() => "");
  } catch {
    statusCode = 0;
    body = "Connection failed";
  }

  await db
    .update(transactionsTable)
    .set({
      webhookLastStatusCode: statusCode,
      webhookLastBody: body.slice(0, 500),
      webhookLastSentAt: new Date(),
    })
    .where(eq(transactionsTable.id, txId));

  res.json({ message: "Webhook resent", statusCode, sentAt: new Date() });
});

const payinSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  countryCode: z.string().length(2),
  operator: z.string().min(1),
  phone: z.string().min(8),
  description: z.string().optional(),
  externalRef: z.string().optional(),
});

router.post("/dashboard/payin", requireAuth, async (req, res) => {
  const parsed = payinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const userId = req.session.userId!;
  const currentMode = (req.session.mode ?? "sandbox") as "sandbox" | "live";
  const { amount, currency, countryCode, operator, phone, description, externalRef } = parsed.data;

  // Check operator availability
  const opCheck = await checkOperatorAvailable(countryCode, operator, "deposits");
  if (!opCheck.ok) {
    res.status(opCheck.status).json({ error: opCheck.error });
    return;
  }

  let [wallet] = await db
    .select()
    .from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.countryCode, countryCode), eq(walletsTable.mode, currentMode)));

  if (!wallet) {
    [wallet] = await db
      .insert(walletsTable)
      .values({ userId, countryCode, currency, mode: currentMode })
      .returning();
  }

  const feeRate = await getUserFeeRate(userId);
  const fee = Math.round(amount * feeRate * 100) / 100;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  const reference = `PAY-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      userId,
      walletId: wallet.id,
      reference,
      type: "payin",
      status: "success",
      amount: String(amount),
      fee: String(fee),
      netAmount: String(netAmount),
      currency,
      countryCode,
      operator,
      phone,
      description,
      externalRef,
      mode: currentMode,
    })
    .returning();

  await db
    .update(walletsTable)
    .set({ balance: sql`${walletsTable.balance} + ${netAmount}` })
    .where(eq(walletsTable.id, wallet.id));

  const [updatedWallet] = await db.select().from(walletsTable).where(eq(walletsTable.id, wallet.id));
  res.status(201).json({ transaction: tx, fee, netAmount, feeRate: `${feeRate * 100}%`, walletId: wallet.id, newBalance: parseFloat(String(updatedWallet?.balance ?? 0)) });
});

const payoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  countryCode: z.string().length(2),
  operator: z.string().min(1),
  phone: z.string().min(8),
  description: z.string().optional(),
  externalRef: z.string().optional(),
});

router.post("/dashboard/payout", requireAuth, async (req, res) => {
  const parsed = payoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const userId = req.session.userId!;

  // Block payout for personal accounts
  const [userRecord] = await db.select({ accountType: usersTable.accountType }).from(usersTable).where(eq(usersTable.id, userId));
  if (userRecord?.accountType === "personal") {
    res.status(403).json({ error: "Les comptes personnels n'ont pas accès à l'API Pay-out. Seuls les comptes entreprise peuvent effectuer des retraits." });
    return;
  }

  const currentMode = (req.session.mode ?? "sandbox") as "sandbox" | "live";
  const { amount, currency, countryCode, operator, phone, description, externalRef } = parsed.data;

  // Check operator availability
  const opCheck = await checkOperatorAvailable(countryCode, operator, "withdrawals");
  if (!opCheck.ok) {
    res.status(opCheck.status).json({ error: opCheck.error });
    return;
  }

  const [wallet] = await db
    .select()
    .from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.countryCode, countryCode), eq(walletsTable.mode, currentMode)));

  if (!wallet) {
    res.status(400).json({ error: `Aucun wallet ${currentMode} trouvé pour le pays ${countryCode}. Vous ne pouvez effectuer un payout que depuis des pays où vous avez reçu des fonds.` });
    return;
  }

  const payoutFeeRate = await getUserFeeRate(userId);
  const fee = Math.round(amount * payoutFeeRate * 100) / 100;
  const totalDebit = Math.round((amount + fee) * 100) / 100;
  const currentBalance = parseFloat(String(wallet.balance));

  if (currentBalance < totalDebit) {
    res.status(400).json({ error: `Solde insuffisant. Disponible : ${currentBalance} ${currency}, Requis : ${totalDebit} ${currency} (dont frais ${payoutFeeRate * 100}% de ${fee} ${currency})` });
    return;
  }

  const reference = `OUT-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      userId,
      walletId: wallet.id,
      reference,
      type: "payout",
      status: "success",
      amount: String(amount),
      fee: String(fee),
      netAmount: String(amount),
      currency,
      countryCode,
      operator,
      phone,
      description,
      externalRef,
      mode: currentMode,
    })
    .returning();

  await db
    .update(walletsTable)
    .set({ balance: sql`${walletsTable.balance} - ${totalDebit}` })
    .where(eq(walletsTable.id, wallet.id));

  res.status(201).json({ transaction: tx, fee, totalDebit, feeRate: `${payoutFeeRate * 100}%` });
});

router.get("/dashboard/api-keys", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const keys = await db
    .select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      prefix: apiKeysTable.prefix,
      rawKey: apiKeysTable.rawKey,
      env: apiKeysTable.env,
      status: apiKeysTable.status,
      lastUsedAt: apiKeysTable.lastUsedAt,
      createdAt: apiKeysTable.createdAt,
    })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.userId, userId))
    .orderBy(desc(apiKeysTable.createdAt));

  res.json(keys);
});

const createKeySchema = z.object({
  name: z.string().min(1).max(60),
  env: z.enum(["sandbox", "live"]),
});

router.post("/dashboard/api-keys", requireAuth, async (req, res) => {
  const parsed = createKeySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const userId = req.session.userId!;
  const { name, env } = parsed.data;

  const rawKey = `dp_${env}_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = rawKey.substring(0, 14);
  const keyHash = await bcrypt.hash(rawKey, 10);

  const [key] = await db
    .insert(apiKeysTable)
    .values({ userId, name, keyHash, rawKey, prefix, env })
    .returning({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      prefix: apiKeysTable.prefix,
      rawKey: apiKeysTable.rawKey,
      env: apiKeysTable.env,
      status: apiKeysTable.status,
      createdAt: apiKeysTable.createdAt,
    });

  res.status(201).json({ ...key, warning: "Store this key securely." });
});

router.delete("/dashboard/api-keys/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const keyId = parseInt(req.params.id);

  const [key] = await db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.id, keyId), eq(apiKeysTable.userId, userId)));

  if (!key) {
    res.status(404).json({ error: "API key not found" });
    return;
  }

  await db
    .update(apiKeysTable)
    .set({ status: "revoked" })
    .where(eq(apiKeysTable.id, keyId));

  res.json({ ok: true });
});

// ── In-memory code store for API key regeneration (TTL: 10 min) ──────────────
const apiKeyRegenCodes = new Map<string, { code: string; exp: number }>();

router.post("/dashboard/api-keys/send-code", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const env = req.body?.env as string;
  if (!["sandbox", "live"].includes(env)) {
    res.status(400).json({ error: "env must be sandbox or live" });
    return;
  }

  const [user] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const storeKey = `${userId}:${env}`;
  apiKeyRegenCodes.set(storeKey, { code, exp: Date.now() + 10 * 60 * 1000 });

  // In production replace this with a real email provider
  console.log(`[DrimPay] API key regen code for ${user.email} (${env}): ${code}`);

  const masked = user.email.replace(/(.{2}).+(@.+)/, "$1***$2");
  res.json({ ok: true, email: masked });
});

router.post("/dashboard/api-keys/regenerate", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { env, code } = req.body as { env: string; code: string };

  if (!["sandbox", "live"].includes(env) || !code) {
    res.status(400).json({ error: "Paramètres invalides" });
    return;
  }

  const storeKey = `${userId}:${env}`;
  const stored = apiKeyRegenCodes.get(storeKey);

  if (!stored || Date.now() > stored.exp) {
    res.status(400).json({ error: "Code expiré. Veuillez en demander un nouveau." });
    return;
  }
  if (stored.code !== String(code).trim()) {
    res.status(400).json({ error: "Code incorrect." });
    return;
  }

  apiKeyRegenCodes.delete(storeKey);

  // Revoke all existing active keys for this env
  await db
    .update(apiKeysTable)
    .set({ status: "revoked" })
    .where(and(eq(apiKeysTable.userId, userId), eq(apiKeysTable.env, env as any)));

  // Generate new unique key
  const rawKey = `dp_${env === "sandbox" ? "test" : "live"}_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = rawKey.substring(0, env === "sandbox" ? 12 : 11);
  const keyHash = await bcrypt.hash(rawKey, 10);
  const name = env === "sandbox" ? "Clé Sandbox" : "Clé Live";

  const [key] = await db
    .insert(apiKeysTable)
    .values({ userId, name, keyHash, prefix, env: env as any })
    .returning({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      prefix: apiKeysTable.prefix,
      env: apiKeysTable.env,
      status: apiKeysTable.status,
      createdAt: apiKeysTable.createdAt,
    });

  res.status(201).json({ ...key, rawKey });
});

router.get("/dashboard/kyb", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const [user] = await db.select({ accountType: usersTable.accountType }).from(usersTable).where(eq(usersTable.id, userId));
    const [kyb] = await db
      .select()
      .from(kybSubmissionsTable)
      .where(eq(kybSubmissionsTable.userId, userId));

    res.json({ ...(kyb ?? { status: "pending" }), accountType: user?.accountType ?? "enterprise" });
  } catch (err: any) {
    console.error("[KYB GET error]", err);
    res.status(500).json({ error: "Erreur serveur", details: err?.message ?? String(err) });
  }
});

router.post("/dashboard/kyb", requireAuth, kybUpload.fields([
  { name: "documentIdFront", maxCount: 1 },
  { name: "documentIdBack", maxCount: 1 },
  { name: "documentSelfie", maxCount: 1 },
  { name: "documentRccm", maxCount: 1 },
  { name: "documentCertificate", maxCount: 1 },
  { name: "documentProofAddress", maxCount: 1 },
  { name: "documentBankStatement", maxCount: 1 },
  { name: "documentStatuts", maxCount: 1 },
  { name: "documentLicense", maxCount: 1 },
]), async (req, res) => {
  try {
    const userId = req.session.userId!;

    const existing = await db
      .select()
      .from(kybSubmissionsTable)
      .where(eq(kybSubmissionsTable.userId, userId));

    if (existing.length > 0 && ["submitted", "under_review", "approved"].includes(existing[0].status)) {
      res.status(409).json({ error: "A KYB submission is already in progress or approved." });
      return;
    }

    const body = req.body as Record<string, string>;
    const stepNum = parseInt(body.step ?? "1");

    // Determine account type
    const [userForKyb] = await db.select({ accountType: usersTable.accountType }).from(usersTable).where(eq(usersTable.id, userId));
    const isPersonal = userForKyb?.accountType === "personal";

    let updateValues: Record<string, any> = {};

    // ── Personal KYC flow (3 steps) ──────────────────────────────────────────
    if (isPersonal) {
      if (stepNum === 1) {
        const schema = z.object({
          legalRepName: z.string().min(2),
          legalRepDob: z.string().min(1),
          incorporationCountry: z.string().min(2),
          businessAddress: z.string().min(5),
          legalRepPhone: z.string().min(8),
          legalRepEmail: z.string().email(),
        });
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
          return;
        }
        updateValues = parsed.data;
      } else if (stepNum === 2) {
        const schema = z.object({
          businessDescription: z.string().min(10),
          fundsSource: z.string().min(1),
          website: z.string().url().optional().or(z.literal("")).optional(),
        });
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
          return;
        }
        updateValues = parsed.data;
      } else if (stepNum === 3) {
        const files = req.files as Record<string, Express.Multer.File[]> | undefined;
        const kycDocKeys = ["documentIdFront", "documentIdBack", "documentSelfie"];
        await Promise.all(kycDocKeys.map(async (key) => {
          const file = files?.[key]?.[0];
          if (file) {
            const storagePath = await uploadKybDocument(userId, key, file.buffer, file.mimetype, file.originalname);
            updateValues[key] = storagePath;
          }
        }));
        const hasAllDocs = kycDocKeys.every(k => updateValues[k] || existing[0]?.[k as keyof typeof existing[0]]);
        if (!hasAllDocs) {
          res.status(400).json({ error: "Veuillez téléverser les 3 documents d'identité obligatoires (recto, verso, selfie)." });
          return;
        }
        updateValues.status = "submitted" as const;
        updateValues.submittedAt = new Date();
      }

      let kyb;
      if (existing.length > 0) {
        [kyb] = await db.update(kybSubmissionsTable).set(updateValues).where(eq(kybSubmissionsTable.userId, userId)).returning();
      } else {
        [kyb] = await db.insert(kybSubmissionsTable).values({ userId, ...updateValues }).returning();
      }

      if (stepNum === 3 && kyb.status === "submitted") {
        try {
          const [userInfo] = await db.select({ email: usersTable.email, companyName: usersTable.companyName, country: usersTable.country })
            .from(usersTable).where(eq(usersTable.id, userId));
          if (userInfo) {
            notifyKybSubmitted({
              company: (kyb as any).legalRepName ?? userInfo.companyName,
              email: userInfo.email,
              country: userInfo.country,
              id: kyb.id,
            }).catch(() => {});
            sendKybProcessingEmail({
              to: userInfo.email,
              companyName: (kyb as any).legalRepName ?? userInfo.companyName,
            }).catch((e) => console.error("[KYC] Email error:", e));
          }
        } catch (e) {
          console.error("[KYC] Post-submission notifications error:", e);
        }
      }

      res.status(201).json(kyb);
      return;
    }

    // ── Enterprise KYB flow (4 steps) ────────────────────────────────────────
    if (stepNum === 1) {
      const schema = z.object({
        companyLegalName: z.string().min(2),
        tradeName: z.string().optional(),
        registrationNumber: z.string().min(1),
        taxNumber: z.string().min(1),
        incorporationCountry: z.string().min(2),
        city: z.string().min(2),
        businessAddress: z.string().min(5),
        businessType: z.string().min(1),
        foundingDate: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")).optional(),
        businessDescription: z.string().min(20),
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
        return;
      }
      updateValues = parsed.data;
    } else if (stepNum === 2) {
      const schema = z.object({
        legalRepName: z.string().min(2),
        legalRepDob: z.string().optional(),
        legalRepNationality: z.string().min(2),
        legalRepPhone: z.string().min(8),
        legalRepEmail: z.string().email(),
        legalRepPosition: z.string().min(1),
        legalRepIdType: z.string().min(1),
        legalRepIdNumber: z.string().min(1),
        legalRepIdExpiry: z.string().optional(),
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
        return;
      }
      updateValues = { ...parsed.data };
      // Upload identity documents to Supabase Storage
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const idDocKeys = ["documentIdFront", "documentIdBack", "documentSelfie"];
      await Promise.all(idDocKeys.map(async (key) => {
        const file = files?.[key]?.[0];
        if (file) {
          const storagePath = await uploadKybDocument(userId, key, file.buffer, file.mimetype, file.originalname);
          updateValues[key] = storagePath;
        }
      }));
    } else if (stepNum === 3) {
      updateValues = {};
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const allDocKeys = [
        "documentRccm", "documentCertificate", "documentProofAddress",
        "documentBankStatement", "documentStatuts", "documentLicense",
        "documentIdFront", "documentIdBack", "documentSelfie",
      ];
      // Upload all documents to Supabase Storage in parallel
      await Promise.all(allDocKeys.map(async (key) => {
        const file = files?.[key]?.[0];
        if (file) {
          const storagePath = await uploadKybDocument(userId, key, file.buffer, file.mimetype, file.originalname);
          updateValues[key] = storagePath;
        }
      }));
      if (Object.keys(updateValues).length === 0) {
        res.status(400).json({ error: "Aucun document reçu. Veuillez téléverser les documents obligatoires." });
        return;
      }
    } else if (stepNum === 4) {
      const schema = z.object({
        contractEmail: z.string().email(),
        contractAccepted: z.string().optional(),
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
        return;
      }
      updateValues = {
        contractEmail: parsed.data.contractEmail,
        contractAccepted: parsed.data.contractAccepted === "true",
        contractVersion: "2.1",
        contractSignedAt: new Date(),
        contractIp: req.ip ?? null,
        contractUserAgent: req.headers["user-agent"] ?? null,
        status: "submitted" as const,
        submittedAt: new Date(),
      };
    }

    let kyb;
    if (existing.length > 0) {
      [kyb] = await db
        .update(kybSubmissionsTable)
        .set(updateValues)
        .where(eq(kybSubmissionsTable.userId, userId))
        .returning();
    } else {
      [kyb] = await db
        .insert(kybSubmissionsTable)
        .values({ userId, ...updateValues })
        .returning();
    }

    // Step 4 — PDF + Email + WhatsApp + Telegram
    if (stepNum === 4 && (kyb.status === "submitted")) {
      try {
        const [user] = await db.select({ email: usersTable.email, companyName: usersTable.companyName, country: usersTable.country })
          .from(usersTable).where(eq(usersTable.id, userId));

        if (user) {
          // 1) Telegram
          notifyKybSubmitted({
            company: (kyb as any).companyLegalName ?? user.companyName,
            email: user.email,
            country: user.country,
            id: kyb.id,
          }).catch(() => {});

          // 2) Download contract DOCX template from Supabase (falls back to disk)
          const contractBuf = await downloadContractTemplate();

          const contractTo = (kyb as any).contractEmail || user.email;
          const merchantName = (kyb as any).legalRepName ?? user.companyName;

          // 3) Send email with DOCX contract + instructions to sign and return (fire-and-forget)
          sendContractEmail({
            to: contractTo,
            merchantName,
            contractBuffer: contractBuf,
          }).catch((e) => console.error("[KYB] Email contrat error:", e));

          // 3b) Send KYB processing confirmation email to merchant (fire-and-forget)
          sendKybProcessingEmail({
            to: user.email,
            companyName: (kyb as any).companyLegalName ?? user.companyName,
          }).catch((e) => console.error("[KYB] Email traitement error:", e));

          // 4) WhatsApp notification to DrimPay team (fire-and-forget)
          sendWhatsAppContractNotification({
            merchantName,
            companyName: (kyb as any).companyLegalName ?? user.companyName,
            country: (kyb as any).incorporationCountry ?? user.country,
            contractEmail: contractTo,
            kybId: kyb.id,
          }).catch((e) => console.error("[KYB] WhatsApp error:", e));
        }
      } catch (e) {
        console.error("[KYB] Post-submission notifications error:", e);
      }
    }

    res.status(201).json(kyb);
  } catch (err: any) {
    console.error("[KYB POST error]", err);
    res.status(500).json({ error: "Erreur serveur lors de la soumission KYB", details: err?.message ?? String(err) });
  }
});

const reversementSchema = z.object({
  countryCode: z.string().min(2),
  operator: z.string().min(1),
  phone: z.string().min(8),
  amount: z.number().positive(),
  note: z.string().optional(),
});

router.get("/dashboard/reversements", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const currentMode = (req.session.mode ?? "sandbox") as "sandbox" | "live";
  const rows = await db
    .select()
    .from(reversementsTable)
    .where(and(eq(reversementsTable.userId, userId), eq(reversementsTable.mode, currentMode)))
    .orderBy(desc(reversementsTable.createdAt))
    .limit(50);
  res.json(rows);
});

router.post("/dashboard/reversements", requireAuth, async (req, res) => {
  const parsed = reversementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
    return;
  }
  const userId = req.session.userId!;
  const currentMode = req.session.mode ?? "sandbox";
  const { countryCode, operator, phone, amount, note } = parsed.data;

  const countryMeta = COUNTRIES.find((c) => c.code === countryCode);
  if (!countryMeta) {
    res.status(400).json({ error: "Pays non supporté" });
    return;
  }

  const [wallet] = await db
    .select()
    .from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.countryCode, countryCode), eq(walletsTable.mode, currentMode)));

  if (!wallet) {
    res.status(400).json({ error: `Aucun wallet ${currentMode} actif pour ce pays.` });
    return;
  }

  const fee = +(amount * FEE_RATE).toFixed(2);
  const net = +(amount - fee).toFixed(2);

  if (currentMode === "live") {
    // Live mode: check balance and deduct
    const balance = parseFloat(wallet.balance as string);
    if (amount > balance) {
      res.status(400).json({ error: "Solde insuffisant dans ce wallet." });
      return;
    }
    const newBalance = +(balance - amount).toFixed(2);
    await db
      .update(walletsTable)
      .set({ balance: String(newBalance) })
      .where(eq(walletsTable.id, wallet.id));
  }
  // Sandbox mode: record the reversement but do NOT deduct from wallet

  const [reversement] = await db
    .insert(reversementsTable)
    .values({
      userId,
      walletId: wallet.id,
      countryCode,
      currency: countryMeta.currency,
      operator,
      phone,
      amount: String(amount),
      fee: String(fee),
      net: String(net),
      note: note ?? null,
      status: currentMode === "sandbox" ? "completed" : "pending",
      mode: currentMode,
    })
    .returning();

  // Telegram: notify withdrawal request
  try {
    const [user] = await db.select({ companyName: usersTable.companyName }).from(usersTable).where(eq(usersTable.id, userId));
    notifyReversement({
      company: user?.companyName ?? "?",
      amount,
      currency: countryMeta.currency,
      operator,
      phone,
      country: countryCode,
      mode: currentMode,
    }).catch(() => {});
  } catch {}

  res.status(201).json({ ...reversement, _sandbox: currentMode === "sandbox" });
});

// ─── Settings ───────────────────────────────────────────────────────────────

router.get("/dashboard/settings", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const [user] = await db.select({
    email: usersTable.email,
    companyName: usersTable.companyName,
    webhookUrl: usersTable.webhookUrl,
    staticIp: usersTable.staticIp,
  }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

router.patch("/dashboard/settings/webhook", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const schema = z.object({
    webhookUrl: z.string().url("URL invalide").or(z.literal("")),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalide" }); return; }

  await db.update(usersTable).set({ webhookUrl: result.data.webhookUrl || null }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

router.patch("/dashboard/settings/ip", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const schema = z.object({
    staticIp: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Adresse IP invalide").or(z.literal("")),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalide" }); return; }

  await db.update(usersTable).set({ staticIp: result.data.staticIp || null }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

router.patch("/dashboard/settings/password", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const schema = z.object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(8, "Minimum 8 caractères"),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalide" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  const valid = await bcrypt.compare(result.data.currentPassword, user.passwordHash);
  if (!valid) { res.status(400).json({ error: "Mot de passe actuel incorrect" }); return; }

  const newHash = await bcrypt.hash(result.data.newPassword, 12);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

// ─── Payment Links ───────────────────────────────────────────────────────────

const createPaymentLinkSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().optional(),
  countryCodes: z.array(z.string().length(2)).min(1).optional(),
  countryCode: z.string().optional(),
  operator: z.string().optional(),
  currency: z.string().length(3).optional(),
  fixedAmount: z.boolean().default(true),
  amount: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  expiresInDays: z.number().int().positive().optional(),
});

router.get("/dashboard/payment-links", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const links = await db
    .select()
    .from(paymentLinksTable)
    .where(eq(paymentLinksTable.userId, userId))
    .orderBy(desc(paymentLinksTable.createdAt));
  res.json(links);
});

router.post("/dashboard/payment-links", requireAuth, async (req, res) => {
  const parsed = createPaymentLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
    return;
  }
  const userId = req.session.userId!;
  const { title, description, fixedAmount, amount, maxUses, expiresInDays } = parsed.data;

  // Support both multi-country (countryCodes[]) and legacy single countryCode
  const COUNTRY_CURRENCY: Record<string, string> = {
    TG: "XOF", BJ: "XOF", BF: "XOF", ML: "XOF", SN: "XOF", CI: "XOF",
    CM: "XAF", GH: "GHS", NG: "NGN",
  };
  const selectedCodes = parsed.data.countryCodes ?? (parsed.data.countryCode ? [parsed.data.countryCode] : []);
  if (selectedCodes.length === 0) {
    res.status(400).json({ error: "Au moins un pays doit être sélectionné." });
    return;
  }
  const countryCodeStored = selectedCodes.join(",");
  const operatorStored = parsed.data.operator ?? "all";
  const currencyStored = parsed.data.currency ?? COUNTRY_CURRENCY[selectedCodes[0]] ?? "XOF";

  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400_000) : undefined;

  const [link] = await db
    .insert(paymentLinksTable)
    .values({
      userId,
      token,
      title,
      description,
      countryCode: countryCodeStored,
      operator: operatorStored,
      currency: currencyStored,
      fixedAmount,
      amount: amount ? String(amount) : null,
      maxUses,
      expiresAt,
    })
    .returning();

  res.status(201).json({ link });
});

router.patch("/dashboard/payment-links/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const id = parseInt(req.params.id);
  const { status } = req.body as { status: string };
  const [link] = await db
    .select()
    .from(paymentLinksTable)
    .where(and(eq(paymentLinksTable.id, id), eq(paymentLinksTable.userId, userId)));
  if (!link) { res.status(404).json({ error: "Lien introuvable" }); return; }
  await db.update(paymentLinksTable).set({ status: status as any }).where(eq(paymentLinksTable.id, id));
  res.json({ ok: true });
});

router.delete("/dashboard/payment-links/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const id = parseInt(req.params.id);
  await db.delete(paymentLinksTable).where(and(eq(paymentLinksTable.id, id), eq(paymentLinksTable.userId, userId)));
  res.json({ ok: true });
});

// ─── Public: Pay via link ────────────────────────────────────────────────────

// Country → operators mapping for the pay page
const COUNTRY_OPERATORS: Record<string, { name: string; currency: string }[]> = {
  TG: [{ name: "TMoney", currency: "XOF" }, { name: "Moov Money", currency: "XOF" }],
  BJ: [{ name: "MTN Mobile Money", currency: "XOF" }, { name: "Moov Money", currency: "XOF" }],
  CM: [{ name: "MTN MoMo", currency: "XAF" }, { name: "Orange Money", currency: "XAF" }],
  BF: [{ name: "Orange Money", currency: "XOF" }, { name: "Moov Money", currency: "XOF" }],
  ML: [{ name: "Orange Money", currency: "XOF" }, { name: "Moov Money", currency: "XOF" }],
  SN: [{ name: "Orange Money", currency: "XOF" }, { name: "Wave", currency: "XOF" }],
  CI: [{ name: "MTN", currency: "XOF" }, { name: "Orange Money", currency: "XOF" }, { name: "Wave", currency: "XOF" }, { name: "Moov Money", currency: "XOF" }],
  GH: [{ name: "MTN Ghana", currency: "GHS" }, { name: "Vodafone Ghana", currency: "GHS" }],
  NG: [{ name: "MTN Nigeria", currency: "NGN" }, { name: "Airtel Nigeria", currency: "NGN" }],
};

const COUNTRY_CURRENCY: Record<string, string> = {
  TG: "XOF", BJ: "XOF", BF: "XOF", ML: "XOF", SN: "XOF", CI: "XOF",
  CM: "XAF", GH: "GHS", NG: "NGN",
};

router.get("/pay/:token", async (req, res) => {
  const { token } = req.params;
  const [link] = await db
    .select({
      id: paymentLinksTable.id,
      title: paymentLinksTable.title,
      description: paymentLinksTable.description,
      amount: paymentLinksTable.amount,
      currency: paymentLinksTable.currency,
      countryCode: paymentLinksTable.countryCode,
      operator: paymentLinksTable.operator,
      fixedAmount: paymentLinksTable.fixedAmount,
      maxUses: paymentLinksTable.maxUses,
      uses: paymentLinksTable.uses,
      status: paymentLinksTable.status,
      expiresAt: paymentLinksTable.expiresAt,
      userId: paymentLinksTable.userId,
    })
    .from(paymentLinksTable)
    .where(eq(paymentLinksTable.token, token));

  if (!link) { res.status(404).json({ error: "Lien introuvable" }); return; }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    await db.update(paymentLinksTable).set({ status: "expired" }).where(eq(paymentLinksTable.id, link.id));
    res.status(410).json({ error: "Ce lien de paiement a expiré." }); return;
  }
  if (link.status !== "active") {
    res.status(410).json({ error: `Lien ${link.status === "expired" ? "expiré" : "désactivé"}.` }); return;
  }
  if (link.maxUses && link.uses >= link.maxUses) {
    res.status(410).json({ error: "Ce lien a atteint son nombre maximum d'utilisations." }); return;
  }

  const [merchant] = await db.select({ companyName: usersTable.companyName }).from(usersTable).where(eq(usersTable.id, link.userId));

  // Parse comma-separated country codes (multi-country support)
  const isMultiCountry = link.operator === "all" || link.countryCode.includes(",");
  const countryCodes = link.countryCode.split(",").map(c => c.trim()).filter(Boolean);

  if (isMultiCountry) {
    // Build countries list with their operators
    const countries = countryCodes.map(code => ({
      code,
      currency: COUNTRY_CURRENCY[code] ?? link.currency,
      operators: (COUNTRY_OPERATORS[code] ?? []).map(op => op.name),
    }));

    res.json({
      ...link,
      isMultiCountry: true,
      countries,
      merchantName: merchant?.companyName ?? "Marchand",
    });
    return;
  }

  // Legacy single-country: fetch operator status
  const [op] = await db
    .select()
    .from(operatorsTable)
    .where(and(eq(operatorsTable.countryCode, link.countryCode), eq(operatorsTable.name, link.operator)));

  const [opAgg] = await db
    .select()
    .from(operatorAggregatorsTable)
    .where(and(
      eq(operatorAggregatorsTable.countryCode, link.countryCode),
      eq(operatorAggregatorsTable.operatorName, link.operator),
    ));

  const operatorActive = !!(op && op.active && (!opAgg || (opAgg.active && !opAgg.blockPaymentLinks)));
  const operatorMaintenance = !!(op && op.active && opAgg?.maintenanceMode);

  res.json({
    ...link,
    isMultiCountry: false,
    countries: [{ code: link.countryCode, currency: link.currency, operators: [link.operator] }],
    merchantName: merchant?.companyName ?? "Marchand",
    operatorActive,
    operatorMaintenance,
  });
});

router.post("/pay/:token", async (req, res) => {
  const { token } = req.params;
  const { phone, amount: reqAmount, countryCode: chosenCountry, operator: chosenOperator } = req.body as {
    phone: string; amount: number; countryCode?: string; operator?: string;
  };

  if (!phone || !reqAmount || reqAmount <= 0) {
    res.status(400).json({ error: "Téléphone et montant requis." }); return;
  }

  // ── Blacklist check ──────────────────────────────────────────────────────
  const normalizedPhone = String(phone).replace(/\s+/g, "").trim();
  const [blockedPhone] = await db
    .select({ id: blacklistedPhonesTable.id })
    .from(blacklistedPhonesTable)
    .where(eq(blacklistedPhonesTable.phone, normalizedPhone));
  if (blockedPhone) {
    res.status(403).json({ error: "Ce numéro de téléphone est bloqué et ne peut pas effectuer de paiements." });
    return;
  }

  const [link] = await db.select().from(paymentLinksTable).where(eq(paymentLinksTable.token, token));
  if (!link || link.status !== "active") {
    res.status(410).json({ error: "Lien invalide ou inactif." }); return;
  }
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    res.status(410).json({ error: "Lien expiré." }); return;
  }
  if (link.maxUses && link.uses >= link.maxUses) {
    res.status(410).json({ error: "Nombre d'utilisations maximum atteint." }); return;
  }

  // For multi-country links, use payer's chosen country/operator; else use link's values
  const isMultiCountry = link.operator === "all" || link.countryCode.includes(",");
  const allowedCodes = link.countryCode.split(",").map(c => c.trim());

  let effectiveCountry: string;
  let effectiveOperator: string;
  let effectiveCurrency: string;

  if (isMultiCountry) {
    if (!chosenCountry || !chosenOperator) {
      res.status(400).json({ error: "Veuillez sélectionner un pays et un opérateur." }); return;
    }
    if (!allowedCodes.includes(chosenCountry)) {
      res.status(400).json({ error: "Ce pays n'est pas disponible pour ce lien." }); return;
    }
    effectiveCountry = chosenCountry;
    effectiveOperator = chosenOperator;
    effectiveCurrency = COUNTRY_CURRENCY[chosenCountry] ?? link.currency;
  } else {
    effectiveCountry = link.countryCode;
    effectiveOperator = link.operator;
    effectiveCurrency = link.currency;

    // Check operator availability for single-country links
    const opCheck = await checkOperatorAvailable(effectiveCountry, effectiveOperator, "paymentLinks");
    if (!opCheck.ok) {
      res.status(opCheck.status).json({ error: opCheck.error }); return;
    }
  }

  const amount = link.fixedAmount && link.amount ? parseFloat(String(link.amount)) : reqAmount;
  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  const reference = `LNK-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  let [wallet] = await db
    .select()
    .from(walletsTable)
    .where(and(eq(walletsTable.userId, link.userId), eq(walletsTable.countryCode, effectiveCountry)));

  if (!wallet) {
    [wallet] = await db
      .insert(walletsTable)
      .values({ userId: link.userId, countryCode: effectiveCountry, currency: effectiveCurrency })
      .returning();
  }

  await db.insert(transactionsTable).values({
    userId: link.userId,
    walletId: wallet.id,
    reference,
    type: "payin",
    status: "success",
    amount: String(amount),
    fee: String(fee),
    netAmount: String(netAmount),
    currency: effectiveCurrency,
    countryCode: effectiveCountry,
    operator: effectiveOperator,
    phone,
    description: `Payment link: ${link.title}`,
  });

  await db.update(walletsTable)
    .set({ balance: sql`${walletsTable.balance} + ${netAmount}` })
    .where(eq(walletsTable.id, wallet.id));

  await db.update(paymentLinksTable)
    .set({ uses: sql`${paymentLinksTable.uses} + 1` })
    .where(eq(paymentLinksTable.id, link.id));

  // Telegram: notify payment received via link
  try {
    const [merchant] = await db.select({ companyName: usersTable.companyName })
      .from(usersTable).where(eq(usersTable.id, link.userId));
    notifyPayin({
      company: merchant?.companyName ?? "?",
      amount,
      fee,
      net: netAmount,
      currency: effectiveCurrency,
      operator: effectiveOperator,
      phone,
      country: effectiveCountry,
      reference,
      mode: "live",
      source: "link",
    }).catch(() => {});
  } catch {}

  res.status(201).json({ reference, amount, fee, netAmount, currency: effectiveCurrency });
});

// ─── Payment link attempts (public — log every payer action) ─────────────────

router.post("/pay/:token/attempt", async (req, res) => {
  const { token } = req.params;
  const { phone, amount, name, email, countryCode, operator } = req.body as {
    phone: string; amount?: number; name?: string; email?: string;
    countryCode?: string; operator?: string;
  };

  if (!phone) { res.status(400).json({ error: "phone requis" }); return; }

  const [link] = await db
    .select({ id: paymentLinksTable.id, userId: paymentLinksTable.userId, status: paymentLinksTable.status })
    .from(paymentLinksTable)
    .where(eq(paymentLinksTable.token, token));

  if (!link || link.status !== "active") {
    res.status(410).json({ error: "Lien invalide." }); return;
  }

  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "";
  const ua = req.headers["user-agent"] ?? "";

  const [attempt] = await db.insert(paymentLinkAttemptsTable).values({
    paymentLinkId: link.id,
    merchantId: link.userId,
    phone: String(phone).replace(/\s+/g, "").trim(),
    amount: amount != null ? String(amount) : null,
    name: name || null,
    email: email || null,
    countryCode: countryCode || null,
    operator: operator || null,
    status: "initiated",
    ipAddress: ip,
    userAgent: ua,
  }).returning();

  res.status(201).json({ attemptId: attempt.id });

  // ── Spam detection — fire & forget ─────────────────────────────────────────
  const LINK_SPAM_WINDOW_MIN = 10;
  const LINK_SPAM_THRESHOLD  = 10;
  ;(async () => {
    try {
      const since = new Date(Date.now() - LINK_SPAM_WINDOW_MIN * 60 * 1000);
      const [row] = await db
        .select({ c: count() })
        .from(paymentLinkAttemptsTable)
        .where(and(
          eq(paymentLinkAttemptsTable.merchantId, link.userId),
          gte(paymentLinkAttemptsTable.createdAt, since),
        ));
      if ((row?.c ?? 0) >= LINK_SPAM_THRESHOLD) {
        const [merchant] = await db
          .select({ company: usersTable.companyName, email: usersTable.email })
          .from(usersTable)
          .where(eq(usersTable.id, link.userId));
        if (merchant) {
          await notifyAttemptSpam({
            merchantId: link.userId,
            company: merchant.company,
            email: merchant.email,
            count: row.c,
            windowMinutes: LINK_SPAM_WINDOW_MIN,
            source: "link",
          });
        }
      }
    } catch (e) {
      console.error("[SpamDetect] Link attempt check error:", e);
    }
  })();
});

router.patch("/pay/:token/attempt/:id", async (req, res) => {
  const { token, id } = req.params;
  const { status, transactionReference, note } = req.body as {
    status: string; transactionReference?: string; note?: string;
  };

  const allowed = ["initiated", "confirmed", "success", "failed", "abandoned"];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: "Statut invalide." }); return;
  }

  const [link] = await db
    .select({ id: paymentLinksTable.id })
    .from(paymentLinksTable)
    .where(eq(paymentLinksTable.token, token));

  if (!link) { res.status(404).json({ error: "Lien introuvable." }); return; }

  const [updated] = await db
    .update(paymentLinkAttemptsTable)
    .set({
      status,
      transactionReference: transactionReference ?? null,
      note: note ?? null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(paymentLinkAttemptsTable.id, parseInt(id)),
      eq(paymentLinkAttemptsTable.paymentLinkId, link.id),
    ))
    .returning();

  if (!updated) { res.status(404).json({ error: "Tentative introuvable." }); return; }
  res.json({ ok: true, attempt: updated });
});

// GET /dashboard/attempts — merchant sees their link attempts
router.get("/dashboard/attempts", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { page = "1", limit = "50", status, linkId } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [eq(paymentLinkAttemptsTable.merchantId, userId)];
  if (status && status !== "all") conditions.push(eq(paymentLinkAttemptsTable.status, status));
  if (linkId) conditions.push(eq(paymentLinkAttemptsTable.paymentLinkId, parseInt(linkId)));

  const where = conditions.length ? and(...conditions) : undefined;

  const attempts = await db
    .select({
      id: paymentLinkAttemptsTable.id,
      paymentLinkId: paymentLinkAttemptsTable.paymentLinkId,
      phone: paymentLinkAttemptsTable.phone,
      amount: paymentLinkAttemptsTable.amount,
      name: paymentLinkAttemptsTable.name,
      email: paymentLinkAttemptsTable.email,
      countryCode: paymentLinkAttemptsTable.countryCode,
      operator: paymentLinkAttemptsTable.operator,
      status: paymentLinkAttemptsTable.status,
      transactionReference: paymentLinkAttemptsTable.transactionReference,
      note: paymentLinkAttemptsTable.note,
      createdAt: paymentLinkAttemptsTable.createdAt,
      linkTitle: paymentLinksTable.title,
    })
    .from(paymentLinkAttemptsTable)
    .leftJoin(paymentLinksTable, eq(paymentLinkAttemptsTable.paymentLinkId, paymentLinksTable.id))
    .where(where)
    .orderBy(desc(paymentLinkAttemptsTable.createdAt))
    .limit(limitNum).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(paymentLinkAttemptsTable).where(where);

  res.json({ attempts, total: Number(total), page: pageNum, limit: limitNum });
});

// ─── Mass Payout ─────────────────────────────────────────────────────────────

const massPayoutSchema = z.object({
  description: z.string().optional(),
  recipients: z.array(z.object({
    phone: z.string().min(8),
    amount: z.number().positive(),
    countryCode: z.string().length(2),
    operator: z.string().min(1),
    note: z.string().optional(),
  })).min(1).max(500),
});

router.get("/dashboard/mass-payout", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const currentMode = (req.session.mode ?? "sandbox") as "sandbox" | "live";
  const jobs = await db
    .select()
    .from(massPayoutJobsTable)
    .where(and(eq(massPayoutJobsTable.userId, userId), eq(massPayoutJobsTable.mode, currentMode)))
    .orderBy(desc(massPayoutJobsTable.createdAt))
    .limit(50);
  res.json(jobs);
});

router.post("/dashboard/mass-payout", requireAuth, async (req, res) => {
  const parsed = massPayoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
    return;
  }

  const userId = req.session.userId!;
  const currentMode = req.session.mode ?? "sandbox";
  const { description, recipients } = parsed.data;

  // ── 1. Aggregate total needed (amount + fee) per country ──────────────────
  const totalsPerCountry: Record<string, number> = {};
  for (const r of recipients) {
    const fee = Math.round(r.amount * FEE_RATE * 100) / 100;
    totalsPerCountry[r.countryCode] = (totalsPerCountry[r.countryCode] ?? 0) + r.amount + fee;
  }

  // ── 2. Upfront balance check — block before creating job ──────────────────
  const walletCache: Record<string, typeof walletsTable.$inferSelect> = {};
  const insufficientCountries: { countryCode: string; available: number; required: number; currency: string }[] = [];

  for (const [countryCode, required] of Object.entries(totalsPerCountry)) {
    const [wallet] = await db.select().from(walletsTable)
      .where(and(eq(walletsTable.userId, userId), eq(walletsTable.countryCode, countryCode), eq(walletsTable.mode, currentMode)));

    const available = wallet ? parseFloat(String(wallet.balance)) : 0;
    const countryCurrency = COUNTRIES.find(c => c.code === countryCode)?.currency ?? "XOF";

    if (!wallet || available < required) {
      insufficientCountries.push({ countryCode, available, required, currency: countryCurrency });
    } else {
      walletCache[countryCode] = wallet;
    }
  }

  if (insufficientCountries.length > 0) {
    const first = insufficientCountries[0];
    const country = COUNTRIES.find(c => c.code === first.countryCode);
    res.status(400).json({
      error: `Vous n'avez pas de fonds suffisants pour effectuer cette transaction. Solde disponible : ${first.available.toLocaleString("fr-FR")} ${first.currency}, montant requis : ${Math.ceil(first.required).toLocaleString("fr-FR")} ${first.currency}${country ? ` (${country.name})` : ""}.`,
      code: "INSUFFICIENT_FUNDS",
      details: insufficientCountries,
    });
    return;
  }

  // ── 3. Create the job ─────────────────────────────────────────────────────
  const totalAmount = recipients.reduce((s, r) => s + r.amount, 0);
  const reference = `MASS-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const currency = COUNTRIES.find(c => c.code === recipients[0].countryCode)?.currency ?? "XOF";

  const [job] = await db.insert(massPayoutJobsTable).values({
    userId,
    reference,
    status: "processing",
    totalCount: recipients.length,
    totalAmount: String(totalAmount),
    currency,
    description,
    mode: currentMode,
  }).returning();

  // ── 4. Process recipients — deduct balance in both sandbox and live ────────
  let successCount = 0;
  let failedCount = 0;

  for (const r of recipients) {
    try {
      const countryCurrency = COUNTRIES.find(c => c.code === r.countryCode)?.currency ?? "XOF";
      const fee = Math.round(r.amount * FEE_RATE * 100) / 100;
      const totalDebit = r.amount + fee;
      const txRef = `MASS-OUT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      const wallet = walletCache[r.countryCode];
      if (!wallet) { failedCount++; continue; }

      const currentBalance = parseFloat(String(
        (await db.select().from(walletsTable).where(eq(walletsTable.id, wallet.id)))[0]?.balance ?? "0"
      ));
      if (currentBalance < totalDebit) { failedCount++; continue; }

      await db.insert(transactionsTable).values({
        userId,
        walletId: wallet.id,
        reference: txRef,
        type: "payout",
        status: "success",
        amount: String(r.amount),
        fee: String(fee),
        netAmount: String(r.amount),
        currency: countryCurrency,
        countryCode: r.countryCode,
        operator: r.operator,
        phone: r.phone,
        description: r.note ?? description ?? `Mass payout: ${reference}`,
        mode: currentMode,
      });

      await db.update(walletsTable)
        .set({ balance: sql`${walletsTable.balance} - ${totalDebit}` })
        .where(eq(walletsTable.id, wallet.id));

      successCount++;
    } catch {
      failedCount++;
    }
  }

  await db.update(massPayoutJobsTable).set({
    status: failedCount === recipients.length ? "failed" : "completed",
    successCount,
    failedCount,
    completedAt: new Date(),
  }).where(eq(massPayoutJobsTable.id, job.id));

  res.status(201).json({ job: { ...job, successCount, failedCount }, _sandbox: currentMode === "sandbox" });
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
router.get("/dashboard/notifications", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const currentMode = (req.session.mode ?? "sandbox") as "sandbox" | "live";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [recentTxRows, kybRows, walletRows] = await Promise.all([
    db.select().from(transactionsTable)
      .where(and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.mode, currentMode),
        sql`${transactionsTable.createdAt} >= ${sevenDaysAgo.toISOString()}`
      ))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(50),
    db.select().from(kybSubmissionsTable).where(eq(kybSubmissionsTable.userId, userId)).limit(1),
    db.select().from(walletsTable).where(and(eq(walletsTable.userId, userId), eq(walletsTable.mode, currentMode))),
  ]);

  const notifs: any[] = [];
  let idCtr = 1;

  const relTime = (d: Date | string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    return `Il y a ${Math.floor(hrs / 24)}j`;
  };

  const failedTx = recentTxRows.filter(t => t.status === "failed");
  const successTx = recentTxRows.filter(t => t.status === "success");
  const pendingTx = recentTxRows.filter(t => t.status === "pending");

  for (const tx of failedTx.slice(0, 3)) {
    notifs.push({
      id: idCtr++,
      type: "error",
      category: "transaction",
      title: `Transaction échouée — ${tx.type === "payin" ? "Pay-in" : "Pay-out"}`,
      body: `Transaction ${tx.reference} de ${parseFloat(String(tx.amount)).toLocaleString("fr-FR")} ${tx.currency} a échoué sur ${tx.countryCode}.`,
      time: relTime(tx.createdAt),
      read: false,
      href: "/dashboard/payments",
      createdAt: tx.createdAt,
    });
  }

  if (successTx.length > 0) {
    const latest = successTx[0];
    notifs.push({
      id: idCtr++,
      type: "success",
      category: "transaction",
      title: `Paiement réussi — ${latest.type === "payin" ? "Pay-in" : "Pay-out"}`,
      body: `${parseFloat(String(latest.amount)).toLocaleString("fr-FR")} ${latest.currency} reçu via ${latest.countryCode}. Réf: ${latest.reference}.`,
      time: relTime(latest.createdAt),
      read: successTx.length <= 1,
      href: "/dashboard/payments",
      createdAt: latest.createdAt,
    });
  }

  if (successTx.length >= 5) {
    const totalVol = successTx.reduce((s, t) => s + parseFloat(String(t.amount)), 0);
    notifs.push({
      id: idCtr++,
      type: "info",
      category: "activite",
      title: `${successTx.length} transactions réussies cette semaine`,
      body: `Volume total de ${totalVol.toLocaleString("fr-FR")} XOF traité avec succès ces 7 derniers jours.`,
      time: "Cette semaine",
      read: true,
      href: "/dashboard/payments",
      createdAt: sevenDaysAgo,
    });
  }

  if (pendingTx.length > 0) {
    notifs.push({
      id: idCtr++,
      type: "warning",
      category: "transaction",
      title: `${pendingTx.length} transaction(s) en attente`,
      body: `${pendingTx.length} transaction(s) sont en cours de traitement sur votre compte.`,
      time: relTime(pendingTx[0].createdAt),
      read: false,
      href: "/dashboard/payments",
      createdAt: pendingTx[0].createdAt,
    });
  }

  const kyb = kybRows[0];
  if (kyb) {
    if (kyb.status === "approved") {
      notifs.push({
        id: idCtr++,
        type: "success",
        category: "kyb",
        title: "Vérification KYB approuvée",
        body: "Votre dossier KYB a été approuvé. Votre compte Live est maintenant actif.",
        time: kyb.reviewedAt ? relTime(kyb.reviewedAt) : "Récemment",
        read: true,
        href: "/dashboard/kyb",
        createdAt: kyb.reviewedAt ?? kyb.createdAt,
      });
    } else if (kyb.status === "submitted" || kyb.status === "under_review") {
      notifs.push({
        id: idCtr++,
        type: "warning",
        category: "kyb",
        title: "KYB en cours d'examen",
        body: "Votre dossier KYB est entre les mains de notre équipe. Traitement sous 1 à 2 jours ouvrables.",
        time: kyb.submittedAt ? relTime(kyb.submittedAt) : "Récemment",
        read: false,
        href: "/dashboard/kyb",
        createdAt: kyb.submittedAt ?? kyb.createdAt,
      });
    } else if (kyb.status === "rejected") {
      notifs.push({
        id: idCtr++,
        type: "error",
        category: "kyb",
        title: "KYB refusé — Action requise",
        body: "Votre dossier KYB a été refusé. Veuillez soumettre à nouveau avec les documents corrects.",
        time: kyb.reviewedAt ? relTime(kyb.reviewedAt) : "Récemment",
        read: false,
        href: "/dashboard/kyb",
        createdAt: kyb.reviewedAt ?? kyb.createdAt,
      });
    } else {
      notifs.push({
        id: idCtr++,
        type: "info",
        category: "kyb",
        title: "Vérification KYB requise",
        body: "Complétez votre vérification KYB pour débloquer toutes les fonctionnalités de votre compte.",
        time: "Aujourd'hui",
        read: false,
        href: "/dashboard/kyb",
        createdAt: new Date(),
      });
    }
  }

  const lowBalanceWallets = walletRows.filter(w => parseFloat(String(w.balance)) < 1000 && parseFloat(String(w.balance)) > 0);
  for (const w of lowBalanceWallets.slice(0, 2)) {
    notifs.push({
      id: idCtr++,
      type: "warning",
      category: "wallet",
      title: `Solde faible — Wallet ${w.countryCode}`,
      body: `Votre wallet ${w.countryCode} affiche un solde de ${parseFloat(String(w.balance)).toLocaleString("fr-FR")} ${w.currency}.`,
      time: "Aujourd'hui",
      read: false,
      href: "/dashboard/wallets",
      createdAt: new Date(),
    });
  }

  notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifs.filter(n => !n.read).length;
  res.json({ notifications: notifs, unreadCount });
});

export default router;
