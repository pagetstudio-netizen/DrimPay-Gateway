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
} from "@workspace/db/schema";
import { eq, and, desc, sum, count, sql } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";

const KYB_UPLOADS_DIR = path.join(process.cwd(), "uploads", "kyb");
if (!fs.existsSync(KYB_UPLOADS_DIR)) fs.mkdirSync(KYB_UPLOADS_DIR, { recursive: true });

const kybStorage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const userId = req.session?.userId ?? "unknown";
    const dir = path.join(KYB_UPLOADS_DIR, String(userId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${Date.now()}${ext}`);
  },
});

const kybUpload = multer({ storage: kybStorage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

// ── Live / Sandbox mode ───────────────────────────────────────────────────────

router.get("/dashboard/mode", requireAuth, (req, res) => {
  if (!req.session.mode) req.session.mode = "sandbox";
  res.json({ mode: req.session.mode });
});

router.post("/dashboard/mode", requireAuth, (req, res) => {
  const { mode } = req.body as { mode?: string };
  if (mode !== "sandbox" && mode !== "live") {
    res.status(400).json({ error: "Mode invalide. Valeurs acceptées : sandbox, live." });
    return;
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

const FEE_RATE = 0.03;

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

  const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));

  const txStats = await db
    .select({
      type: transactionsTable.type,
      status: transactionsTable.status,
      total: sum(transactionsTable.amount),
      totalFees: sum(transactionsTable.fee),
      txCount: count(),
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .groupBy(transactionsTable.type, transactionsTable.status);

  const recentTx = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
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
  const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));

  const enriched = wallets.map((w) => {
    const country = COUNTRIES.find((c) => c.code === w.countryCode);
    return { ...w, country };
  });

  res.json(enriched);
});

router.get("/dashboard/transactions", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { type, status, countryCode, page = "1", limit = "20" } = req.query as Record<string, string>;

  const conditions: any[] = [eq(transactionsTable.userId, userId)];
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
  const { type, status, search, page = "1", limit = "20" } = req.query as Record<string, string>;

  const conditions: any[] = [eq(transactionsTable.userId, userId)];
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
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.countryCode, countryCode)));

  if (!wallet) {
    [wallet] = await db
      .insert(walletsTable)
      .values({ userId, countryCode, currency })
      .returning();
  }

  const fee = Math.round(amount * FEE_RATE * 100) / 100;
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
    })
    .returning();

  await db
    .update(walletsTable)
    .set({ balance: sql`${walletsTable.balance} + ${netAmount}` })
    .where(eq(walletsTable.id, wallet.id));

  res.status(201).json({ transaction: tx, fee, netAmount, feeRate: "3%" });
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
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.countryCode, countryCode)));

  if (!wallet) {
    res.status(400).json({ error: `No wallet found for country ${countryCode}. You can only payout from countries where you have received funds.` });
    return;
  }

  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  const totalDebit = Math.round((amount + fee) * 100) / 100;
  const currentBalance = parseFloat(String(wallet.balance));

  if (currentBalance < totalDebit) {
    res.status(400).json({ error: `Insufficient balance. Available: ${currentBalance} ${currency}, Required: ${totalDebit} ${currency} (including 3% fee of ${fee} ${currency})` });
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
    })
    .returning();

  await db
    .update(walletsTable)
    .set({ balance: sql`${walletsTable.balance} - ${totalDebit}` })
    .where(eq(walletsTable.id, wallet.id));

  res.status(201).json({ transaction: tx, fee, totalDebit, feeRate: "3%" });
});

router.get("/dashboard/api-keys", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const keys = await db
    .select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      prefix: apiKeysTable.prefix,
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
    .values({ userId, name, keyHash, prefix, env })
    .returning({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      prefix: apiKeysTable.prefix,
      env: apiKeysTable.env,
      status: apiKeysTable.status,
      createdAt: apiKeysTable.createdAt,
    });

  res.status(201).json({ ...key, rawKey, warning: "Save this key now. It will not be shown again." });
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
    const [kyb] = await db
      .select()
      .from(kybSubmissionsTable)
      .where(eq(kybSubmissionsTable.userId, userId));

    res.json(kyb ?? { status: "pending" });
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

    let updateValues: Record<string, any> = {};

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
      updateValues = parsed.data;
    } else if (stepNum === 3) {
      updateValues = {};
      // Extract uploaded file names from multipart files
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const step3DocKeys = [
        "documentRccm", "documentCertificate", "documentProofAddress",
        "documentBankStatement", "documentStatuts", "documentLicense",
      ];
      step3DocKeys.forEach((key) => {
        const file = files?.[key]?.[0];
        if (file) updateValues[key] = file.path;
      });
      // Also capture any step-2 identity docs that arrive in the same multipart
      const step2DocKeys = ["documentIdFront", "documentIdBack", "documentSelfie"];
      step2DocKeys.forEach((key) => {
        const file = files?.[key]?.[0];
        if (file) updateValues[key] = file.path;
      });
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
  const rows = await db
    .select()
    .from(reversementsTable)
    .where(eq(reversementsTable.userId, userId))
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
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.countryCode, countryCode)));

  if (!wallet) {
    res.status(400).json({ error: "Aucun wallet actif pour ce pays." });
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
      note: currentMode === "sandbox" ? `[SANDBOX] ${note ?? ""}`.trim() : (note ?? null),
      status: currentMode === "sandbox" ? "completed" : "pending",
    })
    .returning();

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
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.patch("/dashboard/settings/webhook", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const schema = z.object({
    webhookUrl: z.string().url("URL invalide").or(z.literal("")),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalide" });

  await db.update(usersTable).set({ webhookUrl: result.data.webhookUrl || null }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

router.patch("/dashboard/settings/ip", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const schema = z.object({
    staticIp: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Adresse IP invalide").or(z.literal("")),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalide" });

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
  if (!result.success) return res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalide" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  const valid = await bcrypt.compare(result.data.currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ error: "Mot de passe actuel incorrect" });

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

  res.status(201).json({ reference, amount, fee, netAmount, currency: effectiveCurrency });
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
  const jobs = await db
    .select()
    .from(massPayoutJobsTable)
    .where(eq(massPayoutJobsTable.userId, userId))
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
    description: currentMode === "sandbox" ? `[SANDBOX] ${description ?? ""}`.trim() : description,
  }).returning();

  let successCount = 0;
  let failedCount = 0;

  for (const r of recipients) {
    try {
      const countryCurrency = COUNTRIES.find(c => c.code === r.countryCode)?.currency ?? "XOF";
      const fee = Math.round(r.amount * FEE_RATE * 100) / 100;
      const txRef = `MASS-OUT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      let [wallet] = await db.select().from(walletsTable)
        .where(and(eq(walletsTable.userId, userId), eq(walletsTable.countryCode, r.countryCode)));

      if (currentMode === "live") {
        // Live mode: need wallet + sufficient balance
        if (!wallet) { failedCount++; continue; }
        const balance = parseFloat(String(wallet.balance));
        if (balance < r.amount + fee) { failedCount++; continue; }

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
          mode: "live",
        });

        await db.update(walletsTable)
          .set({ balance: sql`${walletsTable.balance} - ${r.amount + fee}` })
          .where(eq(walletsTable.id, wallet.id));
      } else {
        // Sandbox mode: auto-create a sandbox wallet if needed, simulate without real deductions
        if (!wallet) {
          [wallet] = await db.insert(walletsTable)
            .values({ userId, countryCode: r.countryCode, currency: countryCurrency })
            .returning();
        }

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
          description: `[SANDBOX] ${r.note ?? description ?? `Mass payout: ${reference}`}`,
          mode: "sandbox",
        });
      }

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

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [recentTxRows, kybRows, walletRows] = await Promise.all([
    db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.userId, userId), sql`${transactionsTable.createdAt} >= ${sevenDaysAgo.toISOString()}`))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(50),
    db.select().from(kybSubmissionsTable).where(eq(kybSubmissionsTable.userId, userId)).limit(1),
    db.select().from(walletsTable).where(eq(walletsTable.userId, userId)),
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
        time: kyb.updatedAt ? relTime(kyb.updatedAt) : "Récemment",
        read: true,
        href: "/dashboard/kyb",
        createdAt: kyb.updatedAt ?? kyb.createdAt,
      });
    } else if (kyb.status === "submitted" || kyb.status === "under_review") {
      notifs.push({
        id: idCtr++,
        type: "warning",
        category: "kyb",
        title: "KYB en cours d'examen",
        body: "Votre dossier KYB est entre les mains de notre équipe. Traitement sous 1 à 2 jours ouvrables.",
        time: kyb.updatedAt ? relTime(kyb.updatedAt) : "Récemment",
        read: false,
        href: "/dashboard/kyb",
        createdAt: kyb.updatedAt ?? kyb.createdAt,
      });
    } else if (kyb.status === "rejected") {
      notifs.push({
        id: idCtr++,
        type: "error",
        category: "kyb",
        title: "KYB refusé — Action requise",
        body: "Votre dossier KYB a été refusé. Veuillez soumettre à nouveau avec les documents corrects.",
        time: kyb.updatedAt ? relTime(kyb.updatedAt) : "Récemment",
        read: false,
        href: "/dashboard/kyb",
        createdAt: kyb.updatedAt ?? kyb.createdAt,
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
