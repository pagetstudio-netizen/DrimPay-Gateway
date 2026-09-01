/**
 * Gombo Plus webhook handler.
 *
 * The published Gombo Plus contract does not define a signing header. This
 * endpoint therefore correlates only by provider transaction_reference and
 * never treats an unrecognized notification as a transaction.
 */

import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  transactionsTable,
  walletsTable,
  reversementsTable,
} from "@workspace/db/schema";
import { MERCHANT_FAILURE_LABEL } from "../lib/merchant-error";
import { settlePayinStatus } from "../lib/payin-settlement";
import { isAnyGomboPlusConfigured } from "../lib/gombo-plus";
import crypto from "crypto";

const router = Router();

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function normalizeStatus(value: string): "pending" | "processing" | "success" | "failed" | "cancelled" | "expired" {
  const normalized = value.toLowerCase();
  if (normalized.includes("success") || normalized.includes("completed") || normalized.includes("paid") || normalized === "succes") return "success";
  if (normalized.includes("fail") || normalized.includes("error") || normalized.includes("reject") || normalized.includes("declin")) return "failed";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("expir")) return "expired";
  if (normalized.includes("process") || normalized.includes("initi") || normalized.includes("pending")) return "processing";
  return "pending";
}

function signMerchantPayload(payload: string, secret: string, timestamp: number): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
}

router.post("/webhooks/gomboplus", async (req: any, res: any) => {
  // Acknowledge quickly; provider retries should not be caused by merchant
  // webhook delivery or database settlement latency.
  res.status(200).json({ received: true });

  try {
    const body = req.body ?? {};
    const reference = firstString(
      body.transaction_reference,
      body.reference,
      body.content?.transaction_reference,
      body.content?.reference,
    );
    if (!reference) {
      console.warn("[Gombo Plus Webhook] Référence absente — notification ignorée");
      return;
    }

    let [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.externalRef, reference));
    if (!tx) {
      [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.gatewayReference, reference));
    }
    if (!tx) {
      // Some accounts echo the merchant reference in a provider field.
      const merchantReference = firstString(body.merchant_transaction_id, body.order_id, body.content?.merchant_transaction_id);
      if (merchantReference) {
        [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.reference, merchantReference));
      }
    }
    if (!tx) {
      console.warn(`[Gombo Plus Webhook] Transaction introuvable — ref: ${reference}`);
      return;
    }

    const statusValue = firstString(
      body.status,
      body.status_message,
      body.transaction_status,
      body.content?.status,
      body.content?.status_message,
    );
    const status = normalizeStatus(statusValue);
    const failureReason = firstString(body.status_message, body.message, body.error, body.content?.status_message, body.content?.message) || null;

    if (tx.type === "payin") {
      const result = await settlePayinStatus({
        txId: tx.id,
        status: status as any,
        gatewayReference: reference,
        failureReason: status === "failed" ? failureReason ?? "Transaction Gombo Plus échouée." : undefined,
        gateway: "gomboplus",
      });
      console.log(`[Gombo Plus Webhook] Payin ${tx.reference} → ${status} (crédité: ${result.credited})`);
    } else if (status === "failed" || status === "cancelled" || status === "expired") {
      const totalDebit = parseFloat(tx.amount) + parseFloat(tx.fee);
      const refunded = await db.transaction(async (trx) => {
        const [row] = await trx
          .update(transactionsTable)
          .set({
            status: status as any,
            gatewayReference: reference,
            failureReason,
            updatedAt: new Date(),
          })
          .where(and(
            eq(transactionsTable.id, tx.id),
            sql`${transactionsTable.status} NOT IN ('failed', 'cancelled', 'expired', 'success')`,
          ))
          .returning();
        if (!row) return false;
        await trx.update(walletsTable)
          .set({ balance: sql`${walletsTable.balance} + ${totalDebit}` })
          .where(eq(walletsTable.id, tx.walletId));
        return true;
      });
      if (refunded) console.log(`[Gombo Plus Webhook] Payout ${tx.reference} échoué — wallet remboursé.`);
    } else {
      await db.update(transactionsTable)
        .set({ status: status as any, gatewayReference: reference, updatedAt: new Date() })
        .where(eq(transactionsTable.id, tx.id));
    }

    if (tx.type === "payout" && tx.reference.startsWith("REV-")) {
      await db.update(reversementsTable)
        .set({
          status: status === "success" ? "completed" : (["failed", "cancelled", "expired"].includes(status) ? "failed" : "pending"),
          ...(failureReason ? { failureReason } : {}),
        })
        .where(eq(reversementsTable.reference, tx.reference));
    }

    if (tx.webhookUrl && tx.webhookSignatureKey) {
      const event = tx.type === "payout" ? `payout.${status}` : `payin.${status}`;
      const payload = {
        event,
        reference: tx.reference,
        order_id: tx.orderId,
        status,
        amount: parseFloat(tx.amount),
        fee: parseFloat(tx.fee),
        net_amount: parseFloat(tx.netAmount),
        currency: tx.currency,
        country_code: tx.countryCode,
        operator: tx.operator,
        phone: tx.phone,
        mode: tx.mode,
        failure_reason: ["failed", "cancelled", "expired"].includes(status) ? MERCHANT_FAILURE_LABEL : null,
        gomboplus_reference: reference,
        created_at: tx.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
      };
      const payloadBody = JSON.stringify(payload);
      const timestamp = Math.floor(Date.now() / 1000);
      try {
        const response = await fetch(tx.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-DrimPay-Signature": `t=${timestamp},v1=${signMerchantPayload(payloadBody, tx.webhookSignatureKey, timestamp)}`,
            "X-DrimPay-Timestamp": String(timestamp),
            "X-DrimPay-Event": event,
          },
          body: payloadBody,
          signal: AbortSignal.timeout(10_000),
        });
        await db.update(transactionsTable)
          .set({
            webhookLastStatusCode: response.status,
            webhookLastBody: payloadBody,
            webhookLastSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(transactionsTable.id, tx.id));
      } catch (err: any) {
        console.warn(`[Gombo Plus Webhook] Échec webhook marchand: ${err?.message ?? err}`);
      }
    }
  } catch (err: any) {
    console.error("[Gombo Plus Webhook] Erreur traitement:", err?.message ?? err);
  }
});

router.get("/webhooks/gomboplus", (_req: any, res: any) => {
  res.json({
    service: "DrimPay",
    webhook: "gomboplus",
    status: "ready",
    configured: isAnyGomboPlusConfigured(),
    timestamp: new Date().toISOString(),
  });
});

export default router;