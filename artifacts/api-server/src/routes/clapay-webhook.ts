/**
 * ─── Clapay → DrimPay Callback Webhook ───────────────────────────────────────
 *
 * Clapay appelle POST /api/webhooks/clapay quand le statut d'un paiement change.
 * Ce handler :
 *   1. Vérifie la signature Clapay
 *   2. Retrouve la transaction via notre référence interne
 *   3. Met à jour le statut en DB
 *   4. Crédite le wallet si payin succès
 *   5. Déclenche le webhook marchand
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, walletsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { getClapayClient, isClapayConfigured, type ClapayWebhookPayload } from "../lib/clapay";

const router = Router();

// ─── HMAC signature helper (pour re-envoyer le webhook au marchand) ───────────
function signMerchantPayload(payload: string, secret: string, timestamp: number): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
}

// ─── Statut mapping Clapay → DrimPay ─────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  "success":    "success",
  "successful": "success",
  "completed":  "success",
  "paid":       "success",
  "failed":     "failed",
  "error":      "failed",
  "rejected":   "failed",
  "declined":   "failed",
  "cancelled":  "cancelled",
  "canceled":   "cancelled",
  "expired":    "expired",
  "pending":    "pending",
  "processing": "processing",
  "initiated":  "processing",
};

// ─── POST /api/webhooks/clapay ────────────────────────────────────────────────
router.post("/webhooks/clapay", async (req: any, res: any) => {
  // Répondre 200 immédiatement pour éviter les retries Clapay pendant le traitement
  res.status(200).json({ received: true });

  try {
    if (!isClapayConfigured()) {
      console.warn("[Clapay Webhook] Clapay non configuré — webhook ignoré");
      return;
    }

    const client = getClapayClient();
    const rawBody = JSON.stringify(req.body);

    // Vérifier la signature Clapay
    const receivedSig = (
      req.headers["x-clapay-signature"] ??
      req.headers["x-signature"] ??
      req.body?.signature ??
      ""
    ) as string;

    const timestamp = parseInt(
      (req.headers["x-clapay-timestamp"] ?? req.body?.timestamp ?? "0") as string
    );

    // Si un secret est configuré, vérifier la signature
    if (receivedSig && process.env.CLAPAY_WEBHOOK_SECRET) {
      if (!client.verifyWebhookSignature(rawBody, receivedSig, timestamp)) {
        console.warn("[Clapay Webhook] Signature invalide — rejeté");
        return;
      }
    }

    // Parser l'événement
    const event: ClapayWebhookPayload = client.parseWebhookEvent(req.body);
    console.log(`[Clapay Webhook] Événement: ${event.event} | clapay_ref: ${event.clapay_reference} | our_ref: ${event.our_reference}`);

    if (!event.our_reference) {
      console.warn("[Clapay Webhook] our_reference manquant — ignoré");
      return;
    }

    // Retrouver la transaction via notre référence
    const [tx] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.reference, event.our_reference));

    if (!tx) {
      console.warn(`[Clapay Webhook] Transaction non trouvée: ${event.our_reference}`);
      return;
    }

    // Mapper le statut
    const newStatus = STATUS_MAP[event.status?.toLowerCase()] ?? "failed";

    // Idempotence — éviter les mises à jour redondantes
    if (tx.status === newStatus) {
      console.log(`[Clapay Webhook] Statut déjà à jour: ${newStatus} — ignoré`);
      return;
    }

    // Mettre à jour le statut en DB
    await db
      .update(transactionsTable)
      .set({
        status: newStatus as any,
        gatewayReference: event.clapay_reference,
        failureReason: event.failure_reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(transactionsTable.id, tx.id));

    // Créditer le wallet si payin succès
    if (newStatus === "success" && tx.type === "payin") {
      await db
        .update(walletsTable)
        .set({ balance: sql`${walletsTable.balance} + ${tx.netAmount}` })
        .where(eq(walletsTable.id, tx.walletId));
      console.log(`[Clapay Webhook] Wallet ${tx.walletId} crédité de ${tx.netAmount} ${tx.currency}`);
    }

    // Si payout échoue → rembourser le solde (le montant a été pré-déduit)
    if ((newStatus === "failed" || newStatus === "cancelled") && tx.type === "payout") {
      const totalDebit = parseFloat(tx.amount) + parseFloat(tx.fee);
      await db
        .update(walletsTable)
        .set({ balance: sql`${walletsTable.balance} + ${totalDebit}` })
        .where(eq(walletsTable.id, tx.walletId));
      console.log(`[Clapay Webhook] Payout échoué — wallet ${tx.walletId} remboursé de ${totalDebit} ${tx.currency}`);
    }

    // Déclencher le webhook marchand si configuré
    if (tx.webhookUrl && tx.webhookSignatureKey) {
      const eventType = tx.type === "payout" ? `payout.${newStatus}` : `payin.${newStatus}`;
      const payload = {
        event: eventType,
        reference: tx.reference,
        order_id: tx.orderId,
        status: newStatus,
        amount: parseFloat(tx.amount),
        fee: parseFloat(tx.fee),
        net_amount: parseFloat(tx.netAmount),
        currency: tx.currency,
        country_code: tx.countryCode,
        operator: tx.operator,
        phone: tx.phone,
        mode: tx.mode,
        failure_reason: event.failure_reason ?? null,
        gateway: "clapay",
        clapay_reference: event.clapay_reference,
        created_at: tx.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
      };

      const body = JSON.stringify(payload);
      const ts = Math.floor(Date.now() / 1000);
      const sig = signMerchantPayload(body, tx.webhookSignatureKey, ts);

      try {
        const r = await fetch(tx.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-DrimPay-Signature": `t=${ts},v1=${sig}`,
            "X-DrimPay-Timestamp": String(ts),
            "X-DrimPay-Event": eventType,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });

        await db
          .update(transactionsTable)
          .set({
            webhookLastStatusCode: r.status,
            webhookLastBody: body,
            webhookLastSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(transactionsTable.id, tx.id));

        console.log(`[Clapay Webhook] Webhook marchand envoyé → HTTP ${r.status}`);
      } catch (err: any) {
        console.warn(`[Clapay Webhook] Échec webhook marchand: ${err.message}`);
      }
    }

    console.log(`[Clapay Webhook] ✓ Transaction ${event.our_reference} → ${newStatus}`);

  } catch (err: any) {
    console.error("[Clapay Webhook] Erreur traitement:", err.message);
  }
});

// ─── GET /api/webhooks/clapay — vérification d'URL ───────────────────────────
router.get("/webhooks/clapay", (_req: any, res: any) => {
  res.json({
    service: "DrimPay",
    webhook: "clapay",
    status: "ready",
    configured: isClapayConfigured(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
