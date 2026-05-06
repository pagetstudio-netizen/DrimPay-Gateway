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
} from "@workspace/db/schema";
import { eq, and, desc, sum, count, sql } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
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

  res.json({
    wallets,
    txStats,
    recentTransactions: recentTx,
    kybStatus: kyb[0]?.status ?? "pending",
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

router.get("/dashboard/kyb", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const [kyb] = await db
    .select()
    .from(kybSubmissionsTable)
    .where(eq(kybSubmissionsTable.userId, userId));

  res.json(kyb ?? { status: "pending" });
});

const kybSchema = z.object({
  companyLegalName: z.string().min(2),
  registrationNumber: z.string().min(1),
  businessType: z.string().min(1),
  incorporationCountry: z.string().min(2),
  businessAddress: z.string().min(5),
  website: z.string().url().optional().or(z.literal("")),
  businessDescription: z.string().min(20),
});

router.post("/dashboard/kyb", requireAuth, async (req, res) => {
  const parsed = kybSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const userId = req.session.userId!;
  const existing = await db
    .select()
    .from(kybSubmissionsTable)
    .where(eq(kybSubmissionsTable.userId, userId));

  if (existing.length > 0 && ["submitted", "under_review", "approved"].includes(existing[0].status)) {
    res.status(409).json({ error: "A KYB submission is already in progress or approved." });
    return;
  }

  const values = {
    userId,
    ...parsed.data,
    status: "submitted" as const,
    submittedAt: new Date(),
  };

  let kyb;
  if (existing.length > 0) {
    [kyb] = await db
      .update(kybSubmissionsTable)
      .set(values)
      .where(eq(kybSubmissionsTable.userId, userId))
      .returning();
  } else {
    [kyb] = await db.insert(kybSubmissionsTable).values(values).returning();
  }

  res.status(201).json(kyb);
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

  const balance = parseFloat(wallet.balance as string);
  if (amount > balance) {
    res.status(400).json({ error: "Solde insuffisant dans ce wallet." });
    return;
  }

  const fee = +(amount * FEE_RATE).toFixed(2);
  const net = +(amount - fee).toFixed(2);

  const newBalance = +(balance - amount).toFixed(2);
  await db
    .update(walletsTable)
    .set({ balance: String(newBalance) })
    .where(eq(walletsTable.id, wallet.id));

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
      status: "pending",
    })
    .returning();

  res.status(201).json(reversement);
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

export default router;
