import { Router } from "express";
import { and, count, desc, eq, gte, or, sql } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  adminSettingsTable,
  kybSubmissionsTable,
  transactionsTable,
  walletsTable,
} from "@workspace/db/schema";
import {
  AggregatorNotConfiguredError,
  checkOperatorAvailable,
  pollUntilSettled,
  resolveAggregator,
  routePayout,
} from "../lib/aggregator-router";
import { buildGatewayPayloadSnapshot } from "../lib/gateway-payload";
import { buildMerchantPayloadSnapshot } from "../lib/merchant-payload";
import { getWebhookBaseUrl } from "../lib/base-urls";
import { getFeeRate } from "../lib/fee-rates";
import {
  isMaintenanceModeOn,
  isPaymentOperationEnabled,
  PAYMENT_UNAVAILABLE_MESSAGE,
} from "../lib/admin-settings";
import { GENERIC_ERROR_MESSAGE, merchantFailureLabel } from "../lib/merchant-error";
import { notifyTransactionFailure } from "../lib/telegram";
import {
  clearWithdrawalFailures,
  getWithdrawalLockStatus,
  payoutRateLimiter,
  recordWithdrawalFailure,
} from "../middlewares/security";
import { deliverWebhook, resolveUser } from "./v2payin";

const router = Router();

const COUNTRY_CURRENCIES: Record<string, string> = {
  TG: "XOF",
  BJ: "XOF",
  BF: "XOF",
  ML: "XOF",
  SN: "XOF",
  CI: "XOF",
  CM: "XAF",
};

const COUNTRY_DIAL_CODES: Record<string, string> = {
  TG: "228",
  BJ: "229",
  BF: "226",
  ML: "223",
  SN: "221",
  CI: "225",
  CM: "237",
};

const PAYOUT_STATUSES = new Set([
  "queued",
  "pending",
  "processing",
  "success",
  "failed",
  "reversed",
  "cancelled",
  "expired",
]);

const webhookUrlSchema = z.string().url().refine(
  value => new URL(value).protocol === "https:",
  "webhook_url must use HTTPS",
);

const payoutSchema = z.object({
  amount: z.coerce.number().finite().min(200),
  currency: z.string().trim().length(3).transform(value => value.toUpperCase()),
  country_code: z.string().trim().length(2).transform(value => value.toUpperCase()),
  operator: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(32),
  external_ref: z.string().trim().min(1).max(128).optional(),
  order_id: z.string().trim().min(1).max(128).optional(),
  webhook_url: webhookUrlSchema.optional(),
  description: z.string().max(255).optional(),
  operator_otp: z.string().max(32).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).refine(
  data => Boolean(data.external_ref || data.order_id),
  { message: "external_ref is required for payout idempotency", path: ["external_ref"] },
).refine(
  data => !data.external_ref || !data.order_id || data.external_ref === data.order_id,
  { message: "external_ref and order_id must match when both are provided", path: ["order_id"] },
);

type PayoutTransaction = typeof transactionsTable.$inferSelect;
type ResolvedPayout = Awaited<ReturnType<typeof resolveAggregator>>;

function normalizeOperator(countryCode: string, value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (
    countryCode === "TG" &&
    ["moovafricatogo", "moovtogo", "moovmoneytogo", "flooz"].includes(slug)
  ) {
    return "Moov Money";
  }
  return value.trim();
}

function normalizePhone(countryCode: string, value: string): string | null {
  const dialCode = COUNTRY_DIAL_CODES[countryCode];
  if (!dialCode) return null;

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  let internationalDigits: string;
  if (trimmed.startsWith("+")) {
    internationalDigits = digits;
  } else if (trimmed.startsWith("00")) {
    internationalDigits = digits.slice(2);
  } else if (digits.startsWith(dialCode) && digits.length > dialCode.length + 6) {
    internationalDigits = digits;
  } else {
    internationalDigits = `${dialCode}${digits.replace(/^0+/, "")}`;
  }

  if (
    !internationalDigits.startsWith(dialCode) ||
    internationalDigits.length < 8 ||
    internationalDigits.length > 15
  ) {
    return null;
  }
  return `+${internationalDigits}`;
}

function parseRequestPayload(value: string | null): Record<string, any> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function samePayoutRequest(
  existing: PayoutTransaction,
  input: {
    amount: number;
    currency: string;
    countryCode: string;
    operator: string;
    phone: string;
    description?: string;
  },
): boolean {
  return Number(existing.amount) === input.amount &&
    existing.currency === input.currency &&
    existing.countryCode === input.countryCode &&
    existing.operator.toLowerCase().replace(/[^a-z0-9]/g, "") === input.operator.toLowerCase().replace(/[^a-z0-9]/g, "") &&
    existing.phone === input.phone &&
    (existing.description ?? "") === (input.description ?? "");
}

function payoutResponse(transaction: PayoutTransaction, idempotent = false) {
  const amount = Number(transaction.amount);
  const fee = Number(transaction.fee);
  const request = parseRequestPayload(transaction.requestPayload);
  return {
    id: transaction.id,
    reference: transaction.reference,
    external_ref: transaction.orderId,
    order_id: transaction.orderId,
    status: transaction.status,
    type: "payout" as const,
    amount,
    fee,
    total_debit: Math.round((amount + fee) * 100) / 100,
    net_amount: Number(transaction.netAmount),
    fee_rate: `${amount > 0 ? Number(((fee / amount) * 100).toFixed(4)) : 0}%`,
    currency: transaction.currency,
    country_code: transaction.countryCode,
    operator: transaction.operator,
    phone: transaction.phone,
    mode: transaction.mode,
    gateway_reference: transaction.externalRef,
    failure_reason: transaction.failureReason
      ? merchantFailureLabel(transaction.failureReason)
      : null,
    webhook_url: transaction.webhookUrl,
    metadata: request.metadata && typeof request.metadata === "object" ? request.metadata : {},
    created_at: transaction.createdAt.toISOString(),
    updated_at: transaction.updatedAt.toISOString(),
    idempotent,
  };
}

function payoutWebhookPayload(transaction: PayoutTransaction) {
  const request = parseRequestPayload(transaction.requestPayload);
  return {
    event: `payout.${transaction.status}`,
    reference: transaction.reference,
    external_ref: transaction.orderId,
    order_id: transaction.orderId,
    status: transaction.status,
    amount: Number(transaction.amount),
    fee: Number(transaction.fee),
    net_amount: Number(transaction.netAmount),
    currency: transaction.currency,
    country_code: transaction.countryCode,
    operator: transaction.operator,
    phone: transaction.phone,
    mode: transaction.mode,
    gateway_reference: transaction.externalRef,
    failure_reason: transaction.failureReason
      ? merchantFailureLabel(transaction.failureReason)
      : null,
    metadata: request.metadata && typeof request.metadata === "object" ? request.metadata : {},
    created_at: transaction.createdAt.toISOString(),
    updated_at: transaction.updatedAt.toISOString(),
  };
}

async function refundPayoutOnce(
  transactionId: number,
  walletId: number,
  totalDebit: number,
  status: "failed" | "cancelled" | "expired",
  failureReason: string,
): Promise<boolean> {
  return db.transaction(async trx => {
    const [updated] = await trx
      .update(transactionsTable)
      .set({ status, failureReason, updatedAt: new Date() })
      .where(and(
        eq(transactionsTable.id, transactionId),
        sql`${transactionsTable.status} NOT IN ('failed', 'cancelled', 'expired', 'success')`,
      ))
      .returning({ id: transactionsTable.id });
    if (!updated) return false;

    await trx
      .update(walletsTable)
      .set({ balance: sql`${walletsTable.balance} + ${totalDebit}` })
      .where(eq(walletsTable.id, walletId));
    return true;
  });
}

async function markPayoutSuccessful(transactionId: number): Promise<void> {
  await db
    .update(transactionsTable)
    .set({ status: "success", updatedAt: new Date() })
    .where(and(
      eq(transactionsTable.id, transactionId),
      sql`${transactionsTable.status} NOT IN ('failed', 'cancelled', 'expired', 'success')`,
    ));
}

async function initiatePayout(req: any, res: any) {
  const parsed = payoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "INVALID_REQUEST",
      message: "Invalid payout parameters",
      details: parsed.error.flatten(),
    });
    return;
  }

  const userId: number = req.resolvedUserId;
  if (!(await isPaymentOperationEnabled(userId, "payout"))) {
    res.status(503).json({
      error: PAYMENT_UNAVAILABLE_MESSAGE,
      code: "PAYMENTS_UNAVAILABLE",
    });
    return;
  }
  const mode = req.resolvedMode === "live" ? "live" : "sandbox";
  const {
    amount,
    currency,
    country_code: countryCode,
    phone: rawPhone,
    webhook_url: webhookUrl,
    description,
    metadata,
    operator_otp: operatorOtp,
  } = parsed.data;
  const externalRef = parsed.data.external_ref ?? parsed.data.order_id!;
  const operator = normalizeOperator(countryCode, parsed.data.operator);
  const phone = normalizePhone(countryCode, rawPhone);

  if (!COUNTRY_CURRENCIES[countryCode]) {
    res.status(400).json({
      error: "INVALID_COUNTRY",
      message: `Country ${countryCode} is not supported for payout`,
    });
    return;
  }
  if (COUNTRY_CURRENCIES[countryCode] !== currency) {
    res.status(400).json({
      error: "INVALID_CURRENCY",
      message: `Country ${countryCode} requires currency ${COUNTRY_CURRENCIES[countryCode]}`,
    });
    return;
  }
  if (!phone) {
    res.status(400).json({
      error: "INVALID_PHONE",
      message: `Phone number does not match country ${countryCode}`,
    });
    return;
  }

  const lock = await getWithdrawalLockStatus(userId);
  if (lock.locked) {
    res.status(423).json({
      error: "WITHDRAWAL_TEMPORARILY_LOCKED",
      message: "Too many failed payout attempts. Try again later.",
      locked_until: lock.lockedUntil?.toISOString() ?? null,
      retry_after_seconds: lock.retryAfterSeconds,
    });
    return;
  }

  if (await isMaintenanceModeOn()) {
    res.status(503).json({
      error: "MAINTENANCE_MODE",
      message: "The platform is temporarily under maintenance.",
    });
    return;
  }

  try {
    const [payoutSetting] = await db
      .select({ value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "payouts_enabled"))
      .limit(1);
    if (payoutSetting?.value === "false") {
      res.status(503).json({
        error: "PAYOUTS_DISABLED",
        message: "Payouts are temporarily disabled by the platform administrator.",
      });
      return;
    }
  } catch {
    res.status(503).json({
      error: "PAYOUTS_UNAVAILABLE",
      message: "Payout configuration is temporarily unavailable.",
    });
    return;
  }

  if (mode === "live") {
    const [kyb] = await db
      .select({ status: kybSubmissionsTable.status })
      .from(kybSubmissionsTable)
      .where(eq(kybSubmissionsTable.userId, userId))
      .limit(1);
    if (!kyb || kyb.status !== "approved") {
      res.status(403).json({
        error: "KYB_NOT_APPROVED",
        message: "Your account must complete KYB verification before sending live payouts.",
      });
      return;
    }
  }

  const operatorCheck = await checkOperatorAvailable(countryCode, operator, "withdrawals");
  if (!operatorCheck.ok) {
    res.status(operatorCheck.status).json({
      error: "PAYOUT_ROUTE_UNAVAILABLE",
      message: operatorCheck.error,
    });
    return;
  }

  let resolved: ResolvedPayout;
  try {
    resolved = await resolveAggregator(countryCode, operator, "payout");
  } catch (error: any) {
    const status = error instanceof AggregatorNotConfiguredError ? 503 : 502;
    res.status(status).json({
      error: error instanceof AggregatorNotConfiguredError
        ? "AGGREGATOR_NOT_CONFIGURED"
        : "PAYOUT_ROUTE_UNAVAILABLE",
      message: GENERIC_ERROR_MESSAGE,
    });
    return;
  }

  const feeRate = await getFeeRate(userId, "payout", countryCode, operator);
  const fee = Math.round(amount * feeRate * 100) / 100;
  const totalDebit = Math.round((amount + fee) * 100) / 100;
  const reference = `OUT-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const callbackUrl = `${getWebhookBaseUrl()}/api/webhooks/${resolved.aggregator}`;
  const normalizedRequest = {
    amount,
    currency,
    country_code: countryCode,
    operator,
    phone,
    external_ref: externalRef,
    order_id: externalRef,
    webhook_url: webhookUrl,
    description,
    operator_otp: operatorOtp,
    metadata,
  };
  const requestPayload = JSON.stringify(buildMerchantPayloadSnapshot(normalizedRequest));
  const gatewayPayload = JSON.stringify(buildGatewayPayloadSnapshot({
    gateway: resolved.aggregator,
    operation: "payout",
    amount,
    currency,
    country_code: countryCode,
    operator,
    phone,
    reference,
    callback_url: callbackUrl,
    description,
  }));

  let reservation: {
    kind: "existing" | "conflict" | "wallet_missing" | "wallet_inactive" | "currency_mismatch" | "insufficient" | "created";
    transaction?: PayoutTransaction;
    balance?: number;
  };
  try {
    reservation = await db.transaction(async trx => {
      const lockKey = `${userId}:${mode}:payout:${externalRef}`;
      await trx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}), 0)`);

      const [existing] = await trx
        .select()
        .from(transactionsTable)
        .where(and(
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.orderId, externalRef),
          eq(transactionsTable.type, "payout"),
          eq(transactionsTable.mode, mode),
        ))
        .limit(1);
      if (existing) {
        return {
          kind: samePayoutRequest(existing, {
            amount,
            currency,
            countryCode,
            operator,
            phone,
            description,
          }) ? "existing" as const : "conflict" as const,
          transaction: existing,
        };
      }

      const [wallet] = await trx
        .select()
        .from(walletsTable)
        .where(and(
          eq(walletsTable.userId, userId),
          eq(walletsTable.countryCode, countryCode),
          eq(walletsTable.mode, mode),
        ))
        .limit(1)
        .for("update");
      if (!wallet) return { kind: "wallet_missing" as const };
      if (!wallet.active) return { kind: "wallet_inactive" as const };
      if (wallet.currency !== currency) return { kind: "currency_mismatch" as const };

      const balance = Number(wallet.balance);
      if (balance < totalDebit) return { kind: "insufficient" as const, balance };

      const [debitedWallet] = await trx
        .update(walletsTable)
        .set({ balance: sql`${walletsTable.balance} - ${totalDebit}` })
        .where(and(
          eq(walletsTable.id, wallet.id),
          gte(walletsTable.balance, String(totalDebit)),
        ))
        .returning({ id: walletsTable.id });
      if (!debitedWallet) return { kind: "insufficient" as const, balance };

      const [transaction] = await trx
        .insert(transactionsTable)
        .values({
          userId,
          walletId: wallet.id,
          reference,
          orderId: externalRef,
          type: "payout",
          status: mode === "sandbox" ? "success" : "pending",
          amount: String(amount),
          fee: String(fee),
          netAmount: String(amount),
          currency,
          countryCode,
          operator,
          phone,
          description,
          webhookUrl,
          webhookSignatureKey: req.resolvedWebhookSecret ?? crypto.randomBytes(32).toString("hex"),
          mode,
          requestPayload,
          gatewayPayload,
        })
        .returning();

      return { kind: "created" as const, transaction };
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({
        error: "DUPLICATE_EXTERNAL_REF",
        message: "This external_ref is already being used for another payout.",
      });
      return;
    }
    throw error;
  }

  if (reservation.kind === "existing" && reservation.transaction) {
    res.status(200).json(payoutResponse(reservation.transaction, true));
    return;
  }
  if (reservation.kind === "conflict" && reservation.transaction) {
    res.status(409).json({
      error: "IDEMPOTENCY_CONFLICT",
      message: "This external_ref was already used with different payout details.",
      reference: reservation.transaction.reference,
    });
    return;
  }
  if (reservation.kind === "wallet_missing") {
    res.status(400).json({
      error: "WALLET_NOT_FOUND",
      message: `No ${mode} wallet exists for ${countryCode}; payouts require funds in the destination-country wallet.`,
    });
    return;
  }
  if (reservation.kind === "wallet_inactive") {
    res.status(403).json({ error: "WALLET_INACTIVE", message: "The destination-country wallet is inactive." });
    return;
  }
  if (reservation.kind === "currency_mismatch") {
    res.status(400).json({ error: "WALLET_CURRENCY_MISMATCH", message: "The wallet currency does not match the requested currency." });
    return;
  }
  if (reservation.kind === "insufficient") {
    res.status(402).json({
      error: "INSUFFICIENT_FUNDS",
      message: `Insufficient wallet balance. Required: ${totalDebit} ${currency}, including ${fee} ${currency} in fees.`,
      available: reservation.balance,
      required: totalDebit,
    });
    return;
  }

  const transaction = reservation.transaction!;
  const walletId = transaction.walletId;

  if (mode === "sandbox") {
    await clearWithdrawalFailures(userId);
    if (webhookUrl) {
      void deliverWebhook(
        webhookUrl,
        payoutWebhookPayload(transaction),
        transaction.webhookSignatureKey!,
        transaction.id,
      ).catch(() => {});
    }
    res.status(201).json({
      ...payoutResponse(transaction),
      message: "Sandbox payout simulated successfully.",
    });
    return;
  }

  let gatewayReference: string;
  try {
    const payout = await routePayout({
      amount,
      currency,
      country_code: countryCode,
      operator,
      phone,
      reference,
      callback_url: callbackUrl,
      description,
      operator_otp: operatorOtp,
    }, resolved);
    gatewayReference = payout.externalRef;
    if (!gatewayReference) throw new Error("Payout provider returned no reference");
  } catch (error: any) {
    const failureReason = error?.message ?? String(error);
    await refundPayoutOnce(transaction.id, walletId, totalDebit, "failed", failureReason);
    await recordWithdrawalFailure(userId, req);
    try {
      void notifyTransactionFailure({
        type: "payout",
        company: String(userId),
        amount,
        currency,
        operator,
        phone,
        country: countryCode,
        reference,
        gateway: resolved.aggregator,
        reason: failureReason,
        mode,
      }).catch(() => {});
    } catch {}
    res.status(error instanceof AggregatorNotConfiguredError ? 503 : 502).json({
      error: "GATEWAY_ERROR",
      message: GENERIC_ERROR_MESSAGE,
      reference,
    });
    return;
  }

  await clearWithdrawalFailures(userId);
  try {
    await db
      .update(transactionsTable)
      .set({ status: "processing", externalRef: gatewayReference, updatedAt: new Date() })
      .where(and(
        eq(transactionsTable.id, transaction.id),
        sql`${transactionsTable.status} NOT IN ('failed', 'cancelled', 'expired', 'success')`,
      ));
  } catch (error) {
    // The provider accepted the payout; never refund solely because this status write failed.
    console.error(`[V2 Payout] Accepted payout ${reference}, but could not persist provider status`, error);
  }

  const [latest] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, transaction.id))
    .limit(1);
  res.status(201).json({
    ...payoutResponse(latest ?? { ...transaction, status: "processing", externalRef: gatewayReference }),
    message: "Payout accepted and processing. Check the status endpoint for updates; webhook delivery depends on provider notifications.",
  });

  void (async () => {
    try {
      const result = await pollUntilSettled(resolved.aggregator, resolved.client, gatewayReference, {
        intervalMs: 3_000,
        maxDurationMs: 30_000,
        operation: "payout",
      });
      if (!result) return;
      if (result.status === "failed" || result.status === "cancelled" || result.status === "expired") {
        await refundPayoutOnce(
          transaction.id,
          walletId,
          totalDebit,
          result.status,
          result.failureReason ?? "Payout rejected by provider",
        );
      } else if (result.status === "success") {
        await markPayoutSuccessful(transaction.id);
      }
    } catch (error: any) {
      console.warn(`[V2 Payout] Background status check failed for ${reference}: ${error?.message ?? error}`);
    }
  })();
}

router.post("/v2/payout/initiate", resolveUser, payoutRateLimiter, initiatePayout);
// Compatibility alias for the original public API documentation.
router.post("/v2/payout/send", resolveUser, payoutRateLimiter, initiatePayout);

router.get("/v2/payout/transactions", resolveUser, async (req: any, res: any) => {
  const userId: number = req.resolvedUserId;
  const mode = req.resolvedMode === "live" ? "live" : "sandbox";
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const conditions = [
    eq(transactionsTable.userId, userId),
    eq(transactionsTable.mode, mode),
    eq(transactionsTable.type, "payout"),
  ];
  const countryCode = typeof req.query.country_code === "string"
    ? req.query.country_code.toUpperCase()
    : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  if (countryCode) conditions.push(eq(transactionsTable.countryCode, countryCode));
  if (status) {
    if (!PAYOUT_STATUSES.has(status)) {
      res.status(400).json({ error: "INVALID_STATUS", message: "Unknown payout status filter." });
      return;
    }
    conditions.push(eq(transactionsTable.status, status as any));
  }

  const where = and(...conditions);
  const [totalRow] = await db
    .select({ total: count() })
    .from(transactionsTable)
    .where(where);
  const rows = await db
    .select()
    .from(transactionsTable)
    .where(where)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  res.json({
    data: rows.map(row => payoutResponse(row)),
    meta: {
      total: Number(totalRow?.total ?? 0),
      page,
      limit,
      pages: Math.ceil(Number(totalRow?.total ?? 0) / limit),
    },
  });
});

router.get("/v2/payout/wallets/:country_code/balance", resolveUser, async (req: any, res: any) => {
  const userId: number = req.resolvedUserId;
  const mode = req.resolvedMode === "live" ? "live" : "sandbox";
  const countryCode = String(req.params.country_code ?? "").trim().toUpperCase();

  if (!COUNTRY_CURRENCIES[countryCode]) {
    res.status(400).json({
      error: "INVALID_COUNTRY",
      message: `Country ${countryCode} is not supported for payout`,
    });
    return;
  }

  const [wallet] = await db
    .select({
      currency: walletsTable.currency,
      balance: walletsTable.balance,
      active: walletsTable.active,
    })
    .from(walletsTable)
    .where(and(
      eq(walletsTable.userId, userId),
      eq(walletsTable.countryCode, countryCode),
      eq(walletsTable.mode, mode),
    ))
    .limit(1);

  if (!wallet) {
    res.status(404).json({
      error: "WALLET_NOT_FOUND",
      message: `No ${mode} wallet exists for ${countryCode}.`,
    });
    return;
  }

  res.json({
    country_code: countryCode,
    currency: wallet.currency,
    balance: Number(wallet.balance),
    active: wallet.active,
    mode,
  });
});

router.post("/v2/payout/:reference/resend-webhook", resolveUser, async (req: any, res: any) => {
  const userId: number = req.resolvedUserId;
  const mode = req.resolvedMode === "live" ? "live" : "sandbox";
  const [transaction] = await db
    .select()
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.userId, userId),
      eq(transactionsTable.mode, mode),
      eq(transactionsTable.type, "payout"),
      or(
        eq(transactionsTable.reference, req.params.reference),
        eq(transactionsTable.orderId, req.params.reference),
      ),
    ))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(1);

  if (!transaction) {
    res.status(404).json({ error: "NOT_FOUND", message: "Payout not found." });
    return;
  }
  if (!transaction.webhookUrl) {
    res.status(400).json({ error: "NO_WEBHOOK_URL", message: "No webhook URL is configured for this payout." });
    return;
  }

  const signatureKey = transaction.webhookSignatureKey ?? req.resolvedWebhookSecret;
  if (!signatureKey) {
    res.status(409).json({ error: "WEBHOOK_SECRET_UNAVAILABLE", message: "The webhook signing secret is unavailable." });
    return;
  }

  await deliverWebhook(
    transaction.webhookUrl,
    payoutWebhookPayload(transaction),
    signatureKey,
    transaction.id,
  );
  res.json({
    message: "Webhook resend attempted.",
    reference: transaction.reference,
    status: transaction.status,
  });
});

router.get("/v2/payout/:reference", resolveUser, async (req: any, res: any) => {
  const userId: number = req.resolvedUserId;
  const mode = req.resolvedMode === "live" ? "live" : "sandbox";
  const [transaction] = await db
    .select()
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.userId, userId),
      eq(transactionsTable.mode, mode),
      eq(transactionsTable.type, "payout"),
      or(
        eq(transactionsTable.reference, req.params.reference),
        eq(transactionsTable.orderId, req.params.reference),
      ),
    ))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(1);

  if (!transaction) {
    res.status(404).json({ error: "NOT_FOUND", message: "Payout not found." });
    return;
  }
  res.json(payoutResponse(transaction));
});

export default router;