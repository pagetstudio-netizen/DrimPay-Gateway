/**
 * ─── Clapay → DrimPay Callback Webhook ───────────────────────────────────────
 *
 * Clapay appelle POST /webhooks/clapay quand le statut d'un paiement change.
 * Ce handler :
 *   1. Vérifie la signature Clapay
 *   2. Retrouve la transaction via notre référence interne
 *   3. Met à jour le statut en DB
 *   4. Crédite le wallet si succès
 *   5. Déclenche le webhook marchand
 *
 * TODO: Adapter les champs selon la documentation exacte de Clapay
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

// ─── POST /webhooks/clapay ────────────────────────────────────────────────────
router.post("/webhooks/clapay", async (req: any, res: any) => {
  // 1. Répondre 200 immédiatement pour éviter les retries Clapay pendant le traitement
  res.status(200).json({ received: true });

  try {
    if (!isClapayConfigured()) {
      console.warn("[Clapay Webhook] Clapay non configuré — webhook ignoré");
      return;
    }

    const client = getClapayClient();
    const rawBody = JSON.stringify(req.body);

    // 2. Vérifier la signature Clapay
    // TODO: Adapter selon comment Clapay envoie la signature
    // Exemples possibles :
    //   Header : X-Clapay-Signature  → req.headers["x-clapay-signature"]
    //   Header : X-Signature         → req.headers["x-signature"]
    //   Body field                   → req.body.signature
    const receivedSig = (
      req.headers["x-clapay-signature"] ??
      req.headers["x-signature"] ??
      req.body?.signature ??
      ""
    ) as string;

    const timestamp = parseInt(
      (req.headers["x-clapay-timestamp"] ?? req.body?.timestamp ?? "0") as string
    );

    // TODO: Décommenter quand le secret webhook est configuré
    // if (!client.verifyWebhookSignature(rawBody, receivedSig, timestamp)) {
    //   console.warn("[Clapay Webhook] Signature invalide — rejeté");
    //   return;
    // }

    // 3. Parser l'événement
    const event: ClapayWebhookPayload = client.parseWebhookEvent(req.body);
    console.log(`[Clapay Webhook] Événement reçu: ${event.event} | ref: ${event.our_reference}`);

    // 4. Retrouver la transaction via notre référence
    const [tx] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.reference, event.our_reference));

    if (!tx) {
      console.warn(`[Clapay Webhook] Transaction non trouvée: ${event.our_reference}`);
      return;
    }

    // 5. Mapper le statut Clapay → statut DrimPay
    const statusMap: Record<string, string> = {
      // TODO: Adapter les valeurs selon les statuts exacts retournés par Clapay
      "success": "success",
      "completed": "success",
      "paid": "success",
      "failed": "failed",
      "error": "failed",
      "rejected": "failed",
      "cancelled": "cancelled",
      "expired": "expired",
      "pending": "pending",
      "processing": "processing",
    };
    const newStatus = statusMap[event.status?.toLowerCase()] ?? "failed";

    // Éviter les mises à jour inutiles (idempotence)
    if (tx.status === newStatus) {
      console.log(`[Clapay Webhook] Statut déjà à jour: ${newStatus} — ignoré`);
      return;
    }

    // 6. Mettre à jour le statut en DB
    await db
      .update(transactionsTable)
      .set({
        status: newStatus as any,
        gatewayReference: event.clapay_reference,
        failureReason: event.failure_reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(transactionsTable.id, tx.id));

    // 7. Créditer le wallet si payin succès
    if (newStatus === "success" && tx.type === "payin") {
      await db
        .update(walletsTable)
        .set({ balance: sql`${walletsTable.balance} + ${tx.netAmount}` })
        .where(eq(walletsTable.id, tx.walletId));
      console.log(`[Clapay Webhook] Wallet ${tx.walletId} crédité de ${tx.netAmount} ${tx.currency}`);
    }

    // 8. Déclencher le webhook marchand
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

// ─── GET /webhooks/clapay/test ────────────────────────────────────────────────
// Endpoint de vérification (Clapay peut l'appeler pour valider l'URL)
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
