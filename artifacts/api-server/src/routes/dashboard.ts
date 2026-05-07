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
} from "@workspace/db/schema";
import { eq, and, desc, sum, count, sql } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import multer from "multer";

const kybUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

// ─── Payment Links ───────────────────────────────────────────────────────────

const createPaymentLinkSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().optional(),
  countryCode: z.string().length(2),
  operator: z.string().min(1),
  currency: z.string().length(3),
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
  const { title, description, countryCode, operator, currency, fixedAmount, amount, maxUses, expiresInDays } = parsed.data;

  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400_000) : undefined;

  const [link] = await db
    .insert(paymentLinksTable)
    .values({
      userId,
      token,
      title,
      description,
      countryCode,
      operator,
      currency,
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
  res.json({ ...link, merchantName: merchant?.companyName ?? "Marchand" });
});

router.post("/pay/:token", async (req, res) => {
  const { token } = req.params;
  const { phone, amount: reqAmount } = req.body as { phone: string; amount: number };

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

  const amount = link.fixedAmount && link.amount ? parseFloat(String(link.amount)) : reqAmount;
  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  const reference = `LNK-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  let [wallet] = await db
    .select()
    .from(walletsTable)
    .where(and(eq(walletsTable.userId, link.userId), eq(walletsTable.countryCode, link.countryCode)));

  if (!wallet) {
    [wallet] = await db
      .insert(walletsTable)
      .values({ userId: link.userId, countryCode: link.countryCode, currency: link.currency })
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
    currency: link.currency,
    countryCode: link.countryCode,
    operator: link.operator,
    phone,
    description: `Payment link: ${link.title}`,
  });

  await db.update(walletsTable)
    .set({ balance: sql`${walletsTable.balance} + ${netAmount}` })
    .where(eq(walletsTable.id, wallet.id));

  await db.update(paymentLinksTable)
    .set({ uses: sql`${paymentLinksTable.uses} + 1` })
    .where(eq(paymentLinksTable.id, link.id));

  res.status(201).json({ reference, amount, fee, netAmount, currency: link.currency });
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
    description,
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
      });

      await db.update(walletsTable)
        .set({ balance: sql`${walletsTable.balance} - ${r.amount + fee}` })
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

  res.status(201).json({ job: { ...job, successCount, failedCount } });
});

export default router;
