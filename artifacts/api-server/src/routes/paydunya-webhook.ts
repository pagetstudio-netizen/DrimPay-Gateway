/**
 * ─── PayDunya → DrimPay Callback Webhook ─────────────────────────────────────
 *
 * PayDunya appelle POST /api/webhooks/paydunya quand le statut d'un paiement change.
 *
 * TODO: Adapter les champs selon la documentation exacte de PayDunya reçue.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, walletsTable, usersTable, reversementsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { getPayDunyaClient, isPayDunyaConfigured, type PayDunyaWebhookPayload } from "../lib/paydunya";
import { notifyPayinConfirmed } from "../lib/telegram";

const router = Router();

function signMerchantPayload(payload: string, secret: string, timestamp: number): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
}

// ─── POST /api/webhooks/paydunya ──────────────────────────────────────────────
router.post("/webhooks/paydunya", async (req: any, res: any) => {
  // Répondre 200 immédiatement pour éviter les retries PayDunya
  res.status(200).json({ received: true });

  try {
    if (!isPayDunyaConfigured()) {
      console.warn("[PayDunya Webhook] PayDunya non configuré — webhook ignoré");
      return;
    }

    const client = getPayDunyaClient();
    const rawBody = JSON.stringify(req.body);

    // Vérifier la signature PayDunya
    // TODO: Adapter selon le header exact envoyé par PayDunya
    const receivedHash = (
      req.headers["x-paydunya-hash"] ??
      req.headers["x-hash"] ??
      req.body?.hash ??
      ""
    ) as string;

    // TODO: Décommenter quand le secret est configuré
    // if (receivedHash && !client.verifyWebhookSignature(rawBody, receivedHash)) {
    //   console.warn("[PayDunya Webhook] Hash invalide — rejeté");
    //   return;
    // }

    // Parser l'événement
    const event: PayDunyaWebhookPayload = client.parseWebhookEvent(req.body);
    console.log(`[PayDunya Webhook] Événement: ${event.event} | ref: ${event.our_reference}`);

    if (!event.our_reference) {
      console.warn("[PayDunya Webhook] our_reference manquant — ignoré");
      return;
    }

    // Retrouver la transaction via notre référence
    const [tx] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.reference, event.our_reference));

    if (!tx) {
      console.warn(`[PayDunya Webhook] Transaction non trouvée: ${event.our_reference}`);
      return;
    }

    // Mapper le statut PayDunya → statut DrimPay
    const statusMap: Record<string, string> = {
      // TODO: Adapter selon les valeurs exactes de PayDunya
      "completed":  "success",
      "success":    "success",
      "paid":       "success",
      "failed":     "failed",
      "cancelled":  "cancelled",
      "canceled":   "cancelled",
      "pending":    "pending",
      "processing": "processing",
      "expired":    "expired",
    };
    const newStatus = statusMap[event.status?.toLowerCase()] ?? "failed";

    // Idempotence
    if (tx.status === newStatus) {
      console.log(`[PayDunya Webhook] Statut déjà à jour: ${newStatus} — ignoré`);
      return;
    }

    // Mettre à jour en DB
    await db
      .update(transactionsTable)
      .set({
        status: newStatus as any,
        gatewayReference: event.paydunya_reference,
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
      console.log(`[PayDunya Webhook] Wallet ${tx.walletId} crédité de ${tx.netAmount} ${tx.currency}`);

      // Notification Telegram — paiement réellement confirmé
      try {
        const [merchant] = await db.select({ companyName: usersTable.companyName })
          .from(usersTable).where(eq(usersTable.id, tx.userId));
        const source = tx.reference.startsWith("PL-") ? "link" : tx.reference.startsWith("QR-") ? "qr" : "api";
        notifyPayinConfirmed({
          company: merchant?.companyName ?? "?",
          amount: parseFloat(tx.amount),
          fee: parseFloat(tx.fee),
          net: parseFloat(tx.netAmount),
          currency: tx.currency,
          operator: tx.operator,
          phone: tx.phone,
          country: tx.countryCode,
          reference: tx.reference,
          mode: tx.mode,
          source,
          gateway: "paydunya",
        }).catch(() => {});
      } catch {}
    }

    // Si payout échoue → rembourser le solde
    if ((newStatus === "failed" || newStatus === "cancelled") && tx.type === "payout") {
      const totalDebit = parseFloat(tx.amount) + parseFloat(tx.fee);
      await db
        .update(walletsTable)
        .set({ balance: sql`${walletsTable.balance} + ${totalDebit}` })
        .where(eq(walletsTable.id, tx.walletId));
      console.log(`[PayDunya Webhook] Payout échoué — wallet ${tx.walletId} remboursé de ${totalDebit} ${tx.currency}`);
    }

    // Synchroniser le statut du reversement si la transaction vient d'un REV-
    if (tx.type === "payout" && tx.reference.startsWith("REV-")) {
      const revStatus = newStatus === "success" ? "completed" : (newStatus === "failed" || newStatus === "cancelled") ? "failed" : "pending";
      await db
        .update(reversementsTable)
        .set({
          status: revStatus as any,
          ...(event.failure_reason ? { failureReason: event.failure_reason } : {}),
        })
        .where(eq(reversementsTable.reference, tx.reference));
      console.log(`[PayDunya Webhook] Reversement ${tx.reference} → ${revStatus}`);
    }

    // Déclencher le webhook marchand
    if (tx.webhookUrl && tx.webhookSignatureKey) {
      const payload = {
        event: `payin.${newStatus}`,
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
        gateway: "paydunya",
        paydunya_reference: event.paydunya_reference,
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
            "X-DrimPay-Event": payload.event,
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

        console.log(`[PayDunya Webhook] Webhook marchand envoyé → HTTP ${r.status}`);
      } catch (err: any) {
        console.warn(`[PayDunya Webhook] Échec webhook marchand: ${err.message}`);
      }
    }

    console.log(`[PayDunya Webhook] ✓ Transaction ${event.our_reference} → ${newStatus}`);

  } catch (err: any) {
    console.error("[PayDunya Webhook] Erreur traitement:", err.message);
  }
});

// ─── GET /api/webhooks/paydunya — vérification d'URL ─────────────────────────
router.get("/webhooks/paydunya", (_req: any, res: any) => {
  res.json({
    service: "DrimPay",
    webhook: "paydunya",
    status: "ready",
    configured: isPayDunyaConfigured(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
