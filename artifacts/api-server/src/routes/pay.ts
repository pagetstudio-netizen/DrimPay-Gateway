/**
 * ─── Public Payment Link Routes ───────────────────────────────────────────────
 *
 *   GET  /api/pay/:token                   → load link data (public)
 *   POST /api/pay/:token                   → initiate payment
 *   POST /api/pay/:token/attempt           → log attempt
 *   PATCH /api/pay/:token/attempt/:id      → update attempt status
 *   GET  /api/pay/status/:reference        → poll transaction status
 */

import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  paymentLinksTable,
  paymentLinkAttemptsTable,
  usersTable,
  walletsTable,
  transactionsTable,
  operatorAggregatorsTable,
  blacklistedPhonesTable,
} from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";
import { resolveAggregator, AggregatorNotConfiguredError, pollUntilSettled, checkOperatorAvailable } from "../lib/aggregator-router";
import { ClapayClient, ClapayError } from "../lib/clapay";
import { PayDunyaClient, PayDunyaError } from "../lib/paydunya";
import { notifyPayinConfirmed, notifyTransactionFailure } from "../lib/telegram";
import { settlePayinStatus } from "../lib/payin-settlement";
import { GENERIC_ERROR_MESSAGE } from "../lib/merchant-error";
import { getWebhookBaseUrl, getFrontendBaseUrl } from "../lib/base-urls";

const router = Router();

const CURRENCY_MAP: Record<string, string> = {
  TG: "XOF", BJ: "XOF", BF: "XOF", ML: "XOF", SN: "XOF", CI: "XOF",
  CM: "XAF",
};

const DEFAULT_OPERATORS: Record<string, string[]> = {
  TG: ["TMoney", "Moov Money"],
  BJ: ["MTN Mobile Money", "Moov Money"],
  CM: ["MTN MoMo", "Orange Money"],
  BF: ["Orange Money", "Moov Money"],
  ML: ["Orange Money", "Moov Money"],
  SN: ["Orange Money", "Wave"],
  CI: ["MTN", "Orange Money", "Wave", "Moov Money"],
};

const FEE_RATE = 0.035;

function signPayload(payload: string, secret: string, timestamp: number): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
}

// ─── GET /pay/status/:reference ───────────────────────────────────────────────
// Public endpoint: poll transaction status by reference (for payment link flow)
router.get("/pay/status/:reference", async (req: any, res: any) => {
  const { reference } = req.params;
  if (!reference) {
    res.status(400).json({ error: "Reference required" });
    return;
  }

  // Chercher par référence interne d'abord, puis par référence externe (token fournisseur)
  let [tx] = await db
    .select({
      status: transactionsTable.status,
      reference: transactionsTable.reference,
      failureReason: transactionsTable.failureReason,
      amount: transactionsTable.amount,
      currency: transactionsTable.currency,
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.reference, reference));

  if (!tx) {
    // Fallback: chercher par externalRef (token PayDunya/Clapay)
    [tx] = await db
      .select({
        status: transactionsTable.status,
        reference: transactionsTable.reference,
        failureReason: transactionsTable.failureReason,
        amount: transactionsTable.amount,
        currency: transactionsTable.currency,
      })
      .from(transactionsTable)
      .where(eq(transactionsTable.externalRef, reference));
  }

  if (!tx) {
    console.warn(`[Status] Transaction introuvable: ${reference}`);
    res.status(404).json({ error: "Transaction introuvable" });
    return;
  }

  // Normaliser "completed" → "success" pour le frontend
  const normalizedStatus = (tx.status as string) === "completed" ? "success" : tx.status;

  res.json({
    reference: tx.reference,
    status: normalizedStatus,
    amount: tx.amount,
    currency: tx.currency,
    failureReason: tx.failureReason ?? undefined,
  });
});

// ─── GET /pay/:token ───────────────────────────────────────────────────────────
router.get("/pay/:token", async (req: any, res: any) => {
  const { token } = req.params;

  const [link] = await db
    .select()
    .from(paymentLinksTable)
    .where(eq(paymentLinksTable.token, token));

  if (!link) {
    res.status(404).json({ error: "Lien introuvable" });
    return;
  }

  // Auto-expire
  if (link.expiresAt && new Date() > link.expiresAt && link.status === "active") {
    await db.update(paymentLinksTable)
      .set({ status: "expired" })
      .where(eq(paymentLinksTable.id, link.id));
    link.status = "expired";
  }

  // Max uses reached → deactivate
  if (link.maxUses && link.uses >= link.maxUses && link.status === "active") {
    await db.update(paymentLinksTable)
      .set({ status: "inactive" })
      .where(eq(paymentLinksTable.id, link.id));
    link.status = "inactive";
  }

  const [merchant] = await db
    .select({ companyName: usersTable.companyName })
    .from(usersTable)
    .where(eq(usersTable.id, link.userId));

  // Build countries array
  const countryCodes = link.countryCode.split(",").map(c => c.trim()).filter(Boolean);
  const isMultiCountry = countryCodes.length > 1;

  // For each country, build operators list with status from operator_aggregators
  const countries = await Promise.all(countryCodes.map(async (code) => {
    const currency = CURRENCY_MAP[code] ?? "XOF";
    const operators = DEFAULT_OPERATORS[code] ?? [];

    return { code, currency, operators };
  }));

  // For single-country single-operator: check operator status
  let operatorActive: boolean | undefined;
  let operatorMaintenance: boolean | undefined;
  if (!isMultiCountry && countryCodes.length === 1) {
    const operatorName = link.operator === "all"
      ? (DEFAULT_OPERATORS[countryCodes[0]] ?? [])[0]
      : link.operator;
    if (operatorName) {
      const [opAgg] = await db
        .select()
        .from(operatorAggregatorsTable)
        .where(and(
          eq(operatorAggregatorsTable.countryCode, countryCodes[0]),
          eq(operatorAggregatorsTable.operatorName, operatorName),
        ));
      if (opAgg) {
        operatorActive = opAgg.active && !opAgg.blockPaymentLinks;
        operatorMaintenance = opAgg.maintenanceMode;
      }
    }
  }

  res.json({
    title: link.title,
    description: link.description ?? undefined,
    amount: link.amount ?? undefined,
    currency: CURRENCY_MAP[countryCodes[0]] ?? "XOF",
    countryCode: link.countryCode,
    operator: link.operator,
    fixedAmount: link.fixedAmount,
    merchantName: merchant?.companyName ?? "Marchand",
    status: link.status,
    isMultiCountry,
    countries,
    operatorActive,
    operatorMaintenance,
  });
});

// ─── POST /pay/:token/attempt ─────────────────────────────────────────────────
router.post("/pay/:token/attempt", async (req: any, res: any) => {
  const { token } = req.params;
  const { phone, amount, name, email, countryCode, operator } = req.body;

  const [link] = await db
    .select({ id: paymentLinksTable.id, userId: paymentLinksTable.userId })
    .from(paymentLinksTable)
    .where(eq(paymentLinksTable.token, token));

  if (!link) {
    res.status(404).json({ error: "Lien introuvable" });
    return;
  }

  const [attempt] = await db.insert(paymentLinkAttemptsTable).values({
    paymentLinkId: link.id,
    merchantId: link.userId,
    phone: phone ?? "",
    amount: amount ? String(amount) : undefined,
    name: name ?? undefined,
    email: email ?? undefined,
    countryCode: countryCode ?? undefined,
    operator: operator ?? undefined,
    status: "initiated",
    ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? undefined,
    userAgent: req.headers["user-agent"] ?? undefined,
  }).returning();

  res.json({ attemptId: attempt.id });
});

// ─── PATCH /pay/:token/attempt/:id ────────────────────────────────────────────
router.patch("/pay/:token/attempt/:id", async (req: any, res: any) => {
  const attemptId = parseInt(req.params.id);
  const { status, transactionReference } = req.body;

  if (isNaN(attemptId)) {
    res.status(400).json({ error: "Invalid attempt id" });
    return;
  }

  await db.update(paymentLinkAttemptsTable)
    .set({
      status: status ?? undefined,
      transactionReference: transactionReference ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(paymentLinkAttemptsTable.id, attemptId));

  res.json({ ok: true });
});

// ─── POST /pay/:token ─────────────────────────────────────────────────────────
const paySchema = z.object({
  phone: z.string().regex(/^\+?[\d][\d\s\-().]{6,19}$/, "Numéro de téléphone invalide (chiffres uniquement, 8–20 caractères)"),
  amount: z.number().min(200, "Le montant minimum est de 200"),
  countryCode: z.string().length(2),
  operator: z.string().min(1),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  operatorOtp: z.string().optional(),
});

router.post("/pay/:token", async (req: any, res: any) => {
  const { token } = req.params;

  const parsed = paySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Paramètres invalides", details: parsed.error.flatten() });
    return;
  }

  const { phone, amount, countryCode, operator, customerName, customerEmail, operatorOtp } = parsed.data;

  // Load link
  const [link] = await db
    .select()
    .from(paymentLinksTable)
    .where(eq(paymentLinksTable.token, token));

  if (!link) {
    res.status(404).json({ error: "NOT_FOUND", message: "Lien de paiement introuvable" });
    return;
  }

  // Validate link is active
  if (link.expiresAt && new Date() > link.expiresAt) {
    res.status(410).json({ error: "LINK_EXPIRED", message: "Ce lien de paiement a expiré" });
    return;
  }
  if (link.status !== "active") {
    res.status(410).json({ error: "LINK_INACTIVE", message: "Ce lien de paiement n'est plus actif" });
    return;
  }
  if (link.maxUses && link.uses >= link.maxUses) {
    res.status(410).json({ error: "LINK_EXHAUSTED", message: "Ce lien a atteint son nombre maximum d'utilisations" });
    return;
  }

  // Validate country allowed by this link
  const allowedCodes = link.countryCode.split(",").map(c => c.trim());
  if (!allowedCodes.includes(countryCode)) {
    res.status(400).json({ error: "INVALID_COUNTRY", message: `Ce lien n'accepte pas les paiements depuis ${countryCode}` });
    return;
  }

  const currency = CURRENCY_MAP[countryCode];
  if (!currency) {
    res.status(400).json({ error: "UNSUPPORTED_COUNTRY", message: `Pays non supporté : ${countryCode}` });
    return;
  }

  // Blacklist check
  const normalizedPhone = phone.replace(/\s+/g, "").trim();
  const [blacklisted] = await db
    .select({ id: blacklistedPhonesTable.id })
    .from(blacklistedPhonesTable)
    .where(eq(blacklistedPhonesTable.phone, normalizedPhone));
  if (blacklisted) {
    res.status(403).json({ error: "PHONE_BLACKLISTED", message: "Ce numéro est bloqué sur cette plateforme." });
    return;
  }

  // Determine merchant mode (live if KYB approved, else sandbox)
  const [merchantInfo] = await db
    .select({ companyName: usersTable.companyName, webhookUrl: usersTable.webhookUrl })
    .from(usersTable)
    .where(eq(usersTable.id, link.userId));

  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  const reference = `PL-${countryCode}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  const signatureKey = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60_000);

  // Get or create wallet
  let [wallet] = await db
    .select()
    .from(walletsTable)
    .where(and(eq(walletsTable.userId, link.userId), eq(walletsTable.countryCode, countryCode)));

  if (!wallet) {
    [wallet] = await db.insert(walletsTable).values({
      userId: link.userId,
      countryCode,
      currency,
      mode: "live",
    }).returning();
  }

  // Create transaction
  const [tx] = await db.insert(transactionsTable).values({
    userId: link.userId,
    walletId: wallet.id,
    reference,
    orderId: `pl-${token}-${Date.now()}`,
    type: "payin",
    status: "pending",
    amount: String(amount),
    fee: String(fee),
    netAmount: String(netAmount),
    currency,
    countryCode,
    operator,
    phone,
    description: link.title + (customerName ? ` — ${customerName}` : ""),
    webhookUrl: merchantInfo?.webhookUrl ?? undefined,
    webhookSignatureKey: signatureKey,
    mode: "live",
    expiresAt,
    requestPayload: JSON.stringify(req.body),
  }).returning();

  // Route through aggregator
  const baseCallbackUrl = getWebhookBaseUrl();
  const frontendBaseUrl = getFrontendBaseUrl();

  const returnUrl = `${frontendBaseUrl}/fr/pay/${token}`;

  // Vérifier disponibilité opérateur (actif, maintenance, liens bloqués)
  const opCheck = await checkOperatorAvailable(countryCode, operator, "paymentLinks");
  if (!opCheck.ok) {
    res.status(opCheck.status).json({ error: opCheck.error });
    return;
  }

  // Orange Money CI/SN/BF exige un code de confirmation (OTP) généré par USSD
  // par le client avant l'appel à l'agrégateur — le vérifier tôt évite un aller-retour inutile.
  const isOrangeMoneyOp = /^orange( money)?$/i.test(operator.trim());
  const OTP_REQUIRED_COUNTRIES = new Set(["CI", "SN", "BF"]);
  if (isOrangeMoneyOp && OTP_REQUIRED_COUNTRIES.has(countryCode) && !operatorOtp) {
    res.status(400).json({
      error: "OTP_REQUIRED",
      message: "Un code de confirmation Orange Money est requis pour ce pays. " +
        "Composez le code USSD indiqué puis renseignez le code reçu.",
    });
    return;
  }

  try {
    const { aggregator, client } = await resolveAggregator(countryCode, operator);
    const webhookPath = aggregator === "clapay" ? "/api/webhooks/clapay" : "/api/webhooks/paydunya";
    const callbackUrl = `${baseCallbackUrl}${webhookPath}`;

    let externalRef: string;
    let paymentUrl: string | null = null;
    let ussdCode: string | null = null;

    if (aggregator === "clapay") {
      const clapayRes = await (client as ClapayClient).initiatePayin({
        amount, currency, country_code: countryCode, operator, phone,
        reference, order_id: tx.orderId!,
        callback_url: callbackUrl,
        return_url: returnUrl,
        description: link.title,
        customer_name: customerName,
        customer_email: customerEmail,
        operator_otp: operatorOtp,
      });
      if (!clapayRes.success) {
        throw new ClapayError(clapayRes.message ?? "Échec Clapay", 502, clapayRes);
      }
      externalRef = clapayRes.clapay_reference;
      paymentUrl = clapayRes.payment_url ?? null;
      ussdCode = clapayRes.ussd_code ?? null;
    } else {
      const pdRes = await (client as PayDunyaClient).initiatePayin({
        amount, currency, country_code: countryCode, operator, phone,
        reference, order_id: tx.orderId!,
        callback_url: callbackUrl,
        description: link.title,
        customer_name:  customerName,
        customer_email: customerEmail,
        operator_otp: operatorOtp,
      });
      if (!pdRes.success) {
        throw new PayDunyaError(pdRes.message ?? "Échec PayDunya", 502, pdRes);
      }
      externalRef = pdRes.paydunya_reference;
      paymentUrl = pdRes.payment_url ?? null;
    }

    // Sauvegarder externalRef AVANT le poll — le webhook Clapay peut arriver
    // pendant les 20s de polling, et les fallbacks cherchent par externalRef en DB.
    await db.update(transactionsTable)
      .set({ externalRef })
      .where(eq(transactionsTable.id, tx.id));

    // Polling du statut chez le fournisseur (lien de paiement = 4s × max 20s)
    // L'utilisateur doit approuver sur son téléphone. On poll jusqu'à 20s,
    // puis le webhook confirme le statut final si toujours en attente.
    const statusCheck = await pollUntilSettled(aggregator, client, externalRef, {
      intervalMs: 4_000,
      maxDurationMs: 20_000,
    });
    const verifiedStatus = statusCheck?.status ?? "processing";
    const verifiedFailureReason = statusCheck?.failureReason;
    await settlePayinStatus({
      txId: tx.id,
      status: verifiedStatus as any,
      gatewayReference: externalRef,
      failureReason: verifiedFailureReason,
      gateway: aggregator,
    });

    if (verifiedStatus === "failed" || verifiedStatus === "cancelled" || verifiedStatus === "expired") {
      res.status(502).json({
        error: GENERIC_ERROR_MESSAGE,
        reference, status: verifiedStatus,
      });
      return;
    }

    // Increment uses count on payment link
    await db.update(paymentLinksTable)
      .set({ uses: sql`${paymentLinksTable.uses} + 1` })
      .where(eq(paymentLinksTable.id, link.id));

    res.status(201).json({
      reference,
      status: verifiedStatus,
      amount, fee, net_amount: netAmount, currency,
      payment_url: paymentUrl,
      ussd_code: ussdCode,
      message: "Prompt de paiement envoyé au téléphone du client",
      gateway: aggregator,
      verified_status: verifiedStatus,
    });

  } catch (err: any) {
    const realReason = err?.message ?? String(err);
    const gatewayName = err instanceof ClapayError ? "clapay" : err instanceof PayDunyaError ? "paydunya" : "?";
    res.status(502).json({ error: GENERIC_ERROR_MESSAGE, reference });
    await db.update(transactionsTable)
      .set({ status: "failed", failureReason: realReason, updatedAt: new Date() })
      .where(eq(transactionsTable.id, tx.id));
    try {
      const [merchant] = await db.select({ companyName: usersTable.companyName }).from(usersTable).where(eq(usersTable.id, tx.userId));
      notifyTransactionFailure({
        type: "payin",
        company: merchant?.companyName ?? "?",
        amount: parseFloat(tx.amount), currency: tx.currency,
        operator: tx.operator, phone: tx.phone, country: tx.countryCode,
        reference: tx.reference, gateway: gatewayName, reason: realReason, mode: tx.mode,
      }).catch(() => {});
    } catch {}
  }
});

export default router;
