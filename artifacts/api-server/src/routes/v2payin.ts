import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  walletsTable,
  transactionsTable,
  apiKeysTable,
  usersTable,
  blacklistedPhonesTable,
} from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getClapayClient, isClapayConfigured, ClapayError } from "../lib/clapay";
import { getPayDunyaClient, isPayDunyaConfigured, PayDunyaError } from "../lib/paydunya";
import { notifyPayin } from "../lib/telegram";

const router = Router();

// ─── In-memory rate limiter (per API key prefix) ─────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(keyId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(keyId);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(keyId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 100) return false;
  entry.count++;
  return true;
}

// ─── HMAC SHA-256 signature ───────────────────────────────────────────────────
function signPayload(payload: string, secret: string, timestamp: number): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
}

function generateSignatureKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ─── Auth middleware: session (dashboard) OR Bearer API key ──────────────────
async function resolveUser(
  req: any,
  res: any,
  next: any
) {
  // 1. Session auth (dashboard testing)
  if (req.session?.userId) {
    req.resolvedUserId = req.session.userId;
    req.resolvedMode = "sandbox";
    return next();
  }

  // 2. API key auth
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Missing or invalid API key" });
    return;
  }

  const rawKey = authHeader.slice(7);
  const isLive = rawKey.startsWith("dp_live_sk_");
  const isSandbox = rawKey.startsWith("dp_sandbox_sk_");
  if (!isLive && !isSandbox) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "API key must start with dp_live_sk_ or dp_sandbox_sk_" });
    return;
  }

  // Rate limit by key prefix (first 24 chars)
  const rateLimitKey = rawKey.slice(0, 24);
  if (!checkRateLimit(rateLimitKey)) {
    res.status(429).json({
      error: "RATE_LIMITED",
      message: "100 requests per minute exceeded. Retry after 60 seconds.",
      retry_after: 60,
    });
    return;
  }

  // Look up matching API key by bcrypt comparison
  const activeKeys = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.status, "active"));

  let matchedUserId: number | null = null;
  for (const k of activeKeys) {
    if (await bcrypt.compare(rawKey, k.keyHash)) {
      matchedUserId = k.userId;
      break;
    }
  }

  if (!matchedUserId) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid API key" });
    return;
  }

  req.resolvedUserId = matchedUserId;
  req.resolvedMode = isLive ? "live" : "sandbox";
  next();
}

// ─── Geo-isolation guard ──────────────────────────────────────────────────────
function assertGeoMatch(walletCountry: string, requestCountry: string, res: any): boolean {
  if (walletCountry !== requestCountry) {
    res.status(403).json({
      error: "GEO_ISOLATION_VIOLATION",
      message: `Funds collected in ${walletCountry} can only be managed from a ${walletCountry} wallet. Cross-country transfers are blocked.`,
    });
    return false;
  }
  return true;
}

// ─── Webhook delivery with HMAC + retry ──────────────────────────────────────
async function deliverWebhook(
  webhookUrl: string,
  payload: object,
  signatureKey: string,
  txId: number,
  attempt = 1
): Promise<void> {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(body, signatureKey, timestamp);

  let statusCode = 0;
  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DrimPay-Signature": `t=${timestamp},v1=${signature}`,
        "X-DrimPay-Timestamp": String(timestamp),
        "X-DrimPay-Event": (payload as any).event ?? "payin.updated",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    statusCode = r.status;
  } catch {
    statusCode = 0;
  }

  const success = statusCode >= 200 && statusCode < 300;

  await db
    .update(transactionsTable)
    .set({
      webhookLastStatusCode: statusCode,
      webhookLastBody: body,
      webhookLastSentAt: new Date(),
      webhookRetryCount: attempt,
      webhookNextRetryAt: (!success && attempt < 3)
        ? new Date(Date.now() + Math.pow(2, attempt) * 2_000)
        : null,
      updatedAt: new Date(),
    })
    .where(eq(transactionsTable.id, txId));

  // Exponential backoff retry (2s → 4s → 8s), max 3 attempts
  if (!success && attempt < 3) {
    const delay = Math.pow(2, attempt) * 2_000;
    setTimeout(() => deliverWebhook(webhookUrl, payload, signatureKey, txId, attempt + 1), delay);
  }
}

const COUNTRIES: Record<string, string> = {
  TG: "XOF", BJ: "XOF", CM: "XAF", BF: "XOF",
  ML: "XOF", SN: "XOF", CI: "XOF",
};

const FEE_RATE = 0.03;

const EXPIRY_MINUTES: Record<string, number> = { "2": 2, "5": 5, "10": 10 };

// ─── POST /v2/payin/initiate ──────────────────────────────────────────────────
const initiateSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  country_code: z.string().length(2),
  operator: z.string().min(1),
  phone: z.string().min(8),
  order_id: z.string().min(1).max(128),
  webhook_url: z.string().url().optional(),
  description: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  expires_in_minutes: z.number().int().refine(v => [2, 5, 10].includes(v), {
    message: "expires_in_minutes must be 2, 5, or 10",
  }).optional().default(5),
});

router.post("/v2/payin/initiate", resolveUser, async (req: any, res: any) => {
  const parsed = initiateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Invalid parameters", details: parsed.error.flatten() });
    return;
  }

  const userId: number = req.resolvedUserId;
  const mode: string = req.resolvedMode;
  const {
    amount, currency, country_code, operator, phone,
    order_id, webhook_url, description, metadata, expires_in_minutes,
  } = parsed.data;

  // Validate country
  if (!COUNTRIES[country_code]) {
    res.status(400).json({ error: "INVALID_COUNTRY", message: `Country ${country_code} is not supported` });
    return;
  }

  // Validate currency matches country
  const expectedCurrency = COUNTRIES[country_code];
  if (currency !== expectedCurrency) {
    res.status(400).json({
      error: "INVALID_CURRENCY",
      message: `Country ${country_code} requires currency ${expectedCurrency}, received ${currency}`,
    });
    return;
  }

  // ── Blacklist check ────────────────────────────────────────────────────────
  const normalizedPhone = phone.replace(/\s+/g, "").trim();
  const [blacklisted] = await db
    .select({ id: blacklistedPhonesTable.id })
    .from(blacklistedPhonesTable)
    .where(eq(blacklistedPhonesTable.phone, normalizedPhone));
  if (blacklisted) {
    res.status(403).json({
      error: "PHONE_BLACKLISTED",
      message: "Ce numéro de téléphone est bloqué et ne peut pas effectuer de paiements sur cette plateforme.",
    });
    return;
  }

  // Idempotency: check if order_id already exists for this user
  const [existing] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.orderId, order_id)));

  if (existing) {
    res.status(200).json({
      idempotent: true,
      reference: existing.reference,
      order_id: existing.orderId,
      status: existing.status,
      amount: parseFloat(existing.amount),
      fee: parseFloat(existing.fee),
      net_amount: parseFloat(existing.netAmount),
      currency: existing.currency,
      country_code: existing.countryCode,
      operator: existing.operator,
      phone: existing.phone,
      mode: existing.mode,
      expires_at: existing.expiresAt?.toISOString() ?? null,
      created_at: existing.createdAt.toISOString(),
    });
    return;
  }

  // Get or create wallet
  let [wallet] = await db
    .select()
    .from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.countryCode, country_code)));

  if (!wallet) {
    [wallet] = await db
      .insert(walletsTable)
      .values({ userId, countryCode: country_code, currency })
      .returning();
  } else {
    // Geo-isolation: wallet country must match request country
    if (!assertGeoMatch(wallet.countryCode, country_code, res)) return;
  }

  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  const reference = `${country_code}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  const signatureKey = generateSignatureKey();
  const expiresAt = new Date(Date.now() + (expires_in_minutes ?? 5) * 60_000);

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      userId,
      walletId: wallet.id,
      reference,
      orderId: order_id,
      type: "payin",
      status: "pending",
      amount: String(amount),
      fee: String(fee),
      netAmount: String(netAmount),
      currency,
      countryCode: country_code,
      operator,
      phone,
      description,
      webhookUrl: webhook_url,
      webhookSignatureKey: signatureKey,
      mode: mode as any,
      expiresAt,
      requestPayload: JSON.stringify(req.body),
    })
    .returning();

  // ── LIVE mode: route through the configured aggregator (Clapay or PayDunya) ─
  if (mode === "live") {
    // Aggregator priority: env var ACTIVE_AGGREGATOR → clapay → paydunya → error
    // Admin can override by setting ACTIVE_AGGREGATOR=clapay|paydunya
    const preferred = (process.env.ACTIVE_AGGREGATOR ?? "").toLowerCase();
    const useClapay   = preferred === "clapay"   || (preferred !== "paydunya" && isClapayConfigured());
    const usePayDunya = preferred === "paydunya" || (!useClapay && isPayDunyaConfigured());

    if (!useClapay && !usePayDunya) {
      await db
        .update(transactionsTable)
        .set({ status: "failed", failureReason: "Aucun agrégateur configuré (Clapay / PayDunya)", updatedAt: new Date() })
        .where(eq(transactionsTable.id, tx.id));
      res.status(503).json({
        error: "AGGREGATOR_NOT_CONFIGURED",
        message: "Aucun agrégateur de paiement n'est encore configuré. Contactez votre administrateur.",
      });
      return;
    }

    const baseCallbackUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "https://api.drimpay.com";

    // ── Via Clapay ────────────────────────────────────────────────────────
    if (useClapay) {
      try {
        const clapay = getClapayClient();
        const clapayRes = await clapay.initiatePayin({
          amount, currency, country_code, operator, phone, reference, order_id,
          callback_url: `${baseCallbackUrl}/api/webhooks/clapay`,
          description,
        });

        if (!clapayRes.success) {
          await db.update(transactionsTable)
            .set({ status: "failed", failureReason: clapayRes.message ?? "Échec Clapay", updatedAt: new Date() })
            .where(eq(transactionsTable.id, tx.id));
          res.status(502).json({ error: "GATEWAY_ERROR", message: clapayRes.message ?? "Erreur Clapay", reference });
          return;
        }

        await db.update(transactionsTable)
          .set({ status: "processing", externalRef: clapayRes.clapay_reference, updatedAt: new Date() })
          .where(eq(transactionsTable.id, tx.id));

        res.status(201).json({
          reference, order_id, status: "processing",
          amount, fee, net_amount: netAmount, currency, country_code, operator, phone, mode,
          expires_at: expiresAt.toISOString(),
          webhook_url: webhook_url ?? null,
          payment_url: clapayRes.payment_url ?? null,
          ussd_code: clapayRes.ussd_code ?? null,
          message: "Prompt de paiement envoyé au téléphone du client",
          gateway: "clapay",
          clapay_reference: clapayRes.clapay_reference,
          created_at: tx.createdAt.toISOString(),
        });
        return;

      } catch (err: any) {
        const message = err instanceof ClapayError ? `Clapay: ${err.message}` : `Erreur interne: ${err.message}`;
        await db.update(transactionsTable)
          .set({ status: "failed", failureReason: message, updatedAt: new Date() })
          .where(eq(transactionsTable.id, tx.id));
        res.status(502).json({ error: "GATEWAY_ERROR", message, reference });
        return;
      }
    }

    // ── Via PayDunya ──────────────────────────────────────────────────────
    if (usePayDunya) {
      try {
        const paydunya = getPayDunyaClient();
        const pdRes = await paydunya.initiatePayin({
          amount, currency, country_code, operator, phone, reference, order_id,
          callback_url: `${baseCallbackUrl}/api/webhooks/paydunya`,
          description,
        });

        if (!pdRes.success) {
          await db.update(transactionsTable)
            .set({ status: "failed", failureReason: pdRes.message ?? "Échec PayDunya", updatedAt: new Date() })
            .where(eq(transactionsTable.id, tx.id));
          res.status(502).json({ error: "GATEWAY_ERROR", message: pdRes.message ?? "Erreur PayDunya", reference });
          return;
        }

        await db.update(transactionsTable)
          .set({ status: "processing", externalRef: pdRes.paydunya_reference, updatedAt: new Date() })
          .where(eq(transactionsTable.id, tx.id));

        res.status(201).json({
          reference, order_id, status: "processing",
          amount, fee, net_amount: netAmount, currency, country_code, operator, phone, mode,
          expires_at: expiresAt.toISOString(),
          webhook_url: webhook_url ?? null,
          payment_url: pdRes.payment_url ?? null,
          message: "Prompt de paiement envoyé au téléphone du client",
          gateway: "paydunya",
          paydunya_reference: pdRes.paydunya_reference,
          created_at: tx.createdAt.toISOString(),
        });
        return;

      } catch (err: any) {
        const message = err instanceof PayDunyaError ? `PayDunya: ${err.message}` : `Erreur interne: ${err.message}`;
        await db.update(transactionsTable)
          .set({ status: "failed", failureReason: message, updatedAt: new Date() })
          .where(eq(transactionsTable.id, tx.id));
        res.status(502).json({ error: "GATEWAY_ERROR", message, reference });
        return;
      }
    }
  }

  // Telegram: notify payin initiated
  try {
    const [merchant] = await db.select({ companyName: usersTable.companyName })
      .from(usersTable).where(eq(usersTable.id, userId));
    notifyPayin({
      company: merchant?.companyName ?? "?",
      amount,
      fee,
      net: netAmount,
      currency,
      operator,
      phone,
      country: country_code,
      reference,
      mode,
      source: "api",
    }).catch(() => {});
  } catch {}

  // ── SANDBOX mode: simulate async Mobile Money processing (auto-resolve after 3s) ──
  if (mode === "sandbox") {
    setTimeout(async () => {
      const isExpired = new Date() > expiresAt;
      const finalStatus = isExpired ? "expired" : phone.endsWith("2") ? "failed" : "success";

      await db
        .update(transactionsTable)
        .set({
          status: finalStatus as any,
          failureReason: finalStatus === "failed" ? "Payment declined by user" : finalStatus === "expired" ? "Payment expired" : null,
          updatedAt: new Date(),
        })
        .where(eq(transactionsTable.id, tx.id));

      // Credit wallet on success
      if (finalStatus === "success") {
        await db
          .update(walletsTable)
          .set({ balance: sql`${walletsTable.balance} + ${netAmount}` })
          .where(eq(walletsTable.id, wallet.id));
      }

      // Fire webhook
      if (webhook_url) {
        const payload = {
          event: `payin.${finalStatus}`,
          reference,
          order_id,
          status: finalStatus,
          amount,
          fee,
          net_amount: netAmount,
          currency,
          country_code,
          operator,
          phone,
          mode,
          metadata: metadata ?? {},
          created_at: tx.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
        };
        await deliverWebhook(webhook_url, payload, signatureKey, tx.id);
      }
    }, 3_000);
  }

  res.status(201).json({
    reference,
    order_id,
    status: "pending",
    amount,
    fee,
    net_amount: netAmount,
    currency,
    country_code,
    operator,
    phone,
    mode,
    expires_at: expiresAt.toISOString(),
    webhook_url: webhook_url ?? null,
    message: mode === "sandbox"
      ? "Sandbox: payment will auto-resolve in ~3 seconds"
      : "Payment prompt sent to customer's phone",
    created_at: tx.createdAt.toISOString(),
  });
});

// ─── GET /v2/payin/transactions ───────────────────────────────────────────────
router.get("/v2/payin/transactions", resolveUser, async (req: any, res: any) => {
  const userId: number = req.resolvedUserId;
  const { status, country_code, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [eq(transactionsTable.userId, userId), eq(transactionsTable.type, "payin")];
  if (status) conditions.push(eq(transactionsTable.status, status as any));
  if (country_code) conditions.push(eq(transactionsTable.countryCode, country_code));

  const { and: andFn } = await import("drizzle-orm");

  const txs = await db
    .select()
    .from(transactionsTable)
    .where(andFn(...conditions))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(transactionsTable)
    .where(andFn(...conditions));

  res.json({
    data: txs.map(t => ({
      reference: t.reference,
      order_id: t.orderId,
      status: t.status,
      amount: parseFloat(t.amount),
      fee: parseFloat(t.fee),
      net_amount: parseFloat(t.netAmount),
      currency: t.currency,
      country_code: t.countryCode,
      operator: t.operator,
      phone: t.phone,
      mode: t.mode,
      failure_reason: t.failureReason ?? null,
      expires_at: t.expiresAt?.toISOString() ?? null,
      webhook_url: t.webhookUrl ?? null,
      webhook_status_code: t.webhookLastStatusCode ?? null,
      webhook_retry_count: t.webhookRetryCount,
      created_at: t.createdAt.toISOString(),
      updated_at: t.updatedAt.toISOString(),
    })),
    meta: {
      total: Number(total),
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(Number(total) / limitNum),
    },
  });
});

// ─── GET /v2/payin/:reference ─────────────────────────────────────────────────
router.get("/v2/payin/:reference", resolveUser, async (req: any, res: any) => {
  const userId: number = req.resolvedUserId;
  const { reference } = req.params;

  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.reference, reference), eq(transactionsTable.userId, userId)));

  if (!tx) {
    res.status(404).json({ error: "NOT_FOUND", message: `Transaction ${reference} not found` });
    return;
  }

  // Auto-expire: if still pending/queued and past expires_at
  if (tx.expiresAt && new Date() > tx.expiresAt && (tx.status === "pending" || tx.status === "queued")) {
    await db
      .update(transactionsTable)
      .set({ status: "expired", failureReason: "Payment expired", updatedAt: new Date() })
      .where(eq(transactionsTable.id, tx.id));
    tx.status = "expired";
    tx.failureReason = "Payment expired";
  }

  res.json({
    reference: tx.reference,
    order_id: tx.orderId,
    status: tx.status,
    amount: parseFloat(tx.amount),
    fee: parseFloat(tx.fee),
    net_amount: parseFloat(tx.netAmount),
    currency: tx.currency,
    country_code: tx.countryCode,
    operator: tx.operator,
    phone: tx.phone,
    mode: tx.mode,
    description: tx.description ?? null,
    failure_reason: tx.failureReason ?? null,
    expires_at: tx.expiresAt?.toISOString() ?? null,
    webhook_url: tx.webhookUrl ?? null,
    webhook_status_code: tx.webhookLastStatusCode ?? null,
    webhook_retry_count: tx.webhookRetryCount,
    created_at: tx.createdAt.toISOString(),
    updated_at: tx.updatedAt.toISOString(),
  });
});

// ─── POST /v2/payin/:reference/resend-webhook ─────────────────────────────────
router.post("/v2/payin/:reference/resend-webhook", resolveUser, async (req: any, res: any) => {
  const userId: number = req.resolvedUserId;
  const { reference } = req.params;

  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.reference, reference), eq(transactionsTable.userId, userId)));

  if (!tx) {
    res.status(404).json({ error: "NOT_FOUND", message: `Transaction ${reference} not found` });
    return;
  }

  if (!tx.webhookUrl) {
    res.status(400).json({ error: "NO_WEBHOOK_URL", message: "No webhook URL configured for this transaction" });
    return;
  }

  const signatureKey = tx.webhookSignatureKey ?? generateSignatureKey();
  const payload = {
    event: `payin.${tx.status}`,
    reference: tx.reference,
    order_id: tx.orderId,
    status: tx.status,
    amount: parseFloat(tx.amount),
    fee: parseFloat(tx.fee),
    net_amount: parseFloat(tx.netAmount),
    currency: tx.currency,
    country_code: tx.countryCode,
    operator: tx.operator,
    phone: tx.phone,
    mode: tx.mode,
    failure_reason: tx.failureReason ?? null,
    created_at: tx.createdAt.toISOString(),
    resent_at: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(body, signatureKey, timestamp);

  let statusCode = 0;
  try {
    const r = await fetch(tx.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DrimPay-Signature": `t=${timestamp},v1=${signature}`,
        "X-DrimPay-Timestamp": String(timestamp),
        "X-DrimPay-Event": payload.event,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    statusCode = r.status;
  } catch {
    statusCode = 0;
  }

  await db
    .update(transactionsTable)
    .set({
      webhookLastStatusCode: statusCode,
      webhookLastBody: body,
      webhookLastSentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(transactionsTable.id, tx.id));

  res.json({
    message: "Webhook resent",
    reference,
    status_code: statusCode,
    success: statusCode >= 200 && statusCode < 300,
    sent_at: new Date().toISOString(),
    signature_header: `t=${timestamp},v1=${signature}`,
  });
});

export default router;
