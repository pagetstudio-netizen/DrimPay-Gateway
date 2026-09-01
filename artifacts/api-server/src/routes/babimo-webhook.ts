/**
 * Babimo notification handler.
 *
 * Babimo does not document a signing header in the supplied collection, so this
 * endpoint intentionally does not invent one. It correlates by the merchant
 * transaction id first and falls back to the provider reference.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { transactionsTable, walletsTable, usersTable, reversementsTable } from "@workspace/db/schema";
import { isAnyBabimoConfigured } from "../lib/babimo";
import { settlePayinStatus } from "../lib/payin-settlement";

const router = Router();

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function normalizeStatus(value: string): "pending" | "processing" | "success" | "failed" | "cancelled" | "expired" {
  switch (value.toLowerCase()) {
    case "success":
    case "successful":
    case "completed":
    case "paid":
      return "success";
    case "failed":
    case "error":
    case "rejected":
    case "declined":
      return "failed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "expired":
      return "expired";
    case "processing":
    case "initiated":
      return "processing";
    default:
      return "pending";
  }
}

function signMerchantPayload(payload: string, secret: string, timestamp: number): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
}

router.post("/webhooks/babimo", async (req: any, res: any) => {
  res.status(200).json({ received: true });

  try {
    const body = req.body ?? {};
    const data = body?.data ?? body?.result ?? body;
    const reference = firstString(
      data?.merchant_transaction_id,
      body?.merchant_transaction_id,
      data?.refercence_cl,
      body?.refercence_cl,
      data?.reference,
      body?.reference,
      data?.order_id,
      body?.order_id,
    );
    const providerReference = firstString(
      data?.status_token,
      body?.status_token,
      data?.transaction_id,
      body?.transaction_id,
      data?.transactionId,
      body?.transactionId,
      data?.token,
      body?.token,
    );
    const statusValue = firstString(
      data?.status,
      body?.status,
      data?.transaction_status,
      body?.transaction_status,
      data?.payment_status,
      body?.payment_status,
    );
    const status = normalizeStatus(statusValue);
    const failureReason = firstString(
      data?.message,
      body?.message,
      data?.error,
      body?.error,
      data?.description,
      body?.description,
    ) || null;

    if (!reference && !providerReference) {
      console.warn("[Babimo Webhook] Référence absente — notification ignorée");
      return;
    }

    let [tx] = reference
      ? await db.select().from(transactionsTable).where(eq(transactionsTable.reference, reference))
      : [undefined];
    if (!tx && providerReference) {
      [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.externalRef, providerReference));
    }
    if (!tx && providerReference) {
      [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.gatewayReference, providerReference));
    }
    if (!tx) {
      console.warn(`[Babimo Webhook] Transaction introuvable — ref: ${reference || providerReference}`);
      return;
    }

    const gatewayReference = providerReference || tx.externalRef || tx.gatewayReference || undefined;
    if (tx.type === "payin") {
      const result = await settlePayinStatus({
        txId: tx.id,
        status: status as any,
        gatewayReference,
        failureReason: status === "failed" ? failureReason ?? "Transaction Babimo échouée." : undefined,
        gateway: "babimo",
      });
      console.log(`[Babimo Webhook] Payin ${tx.reference} → ${status} (crédité: ${result.credited})`);
    } else if (status === "failed" || status === "cancelled" || status === "expired") {
      const totalDebit = parseFloat(tx.amount) + parseFloat(tx.fee);
      const refunded = await db.transaction(async (trx) => {
        const [row] = await trx
          .update(transactionsTable)
          .set({
            status: status as any,
            gatewayReference,
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
      if (refunded) {
        console.log(`[Babimo Webhook] Payout ${tx.reference} échoué — wallet remboursé.`);
      }
    } else {
      await db.update(transactionsTable)
        .set({ status: status as any, gatewayReference, failureReason, updatedAt: new Date() })
        .where(eq(transactionsTable.id, tx.id));
    }

    if (tx.type === "payout" && tx.reference.startsWith("REV-")) {
      const reversementStatus = status === "success"
        ? "completed"
        : (status === "failed" || status === "cancelled" || status === "expired") ? "failed" : "pending";
      await db.update(reversementsTable)
        .set({ status: reversementStatus as any, ...(failureReason ? { failureReason } : {}) })
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
        failure_reason: failureReason,
        gateway: "babimo",
        babimo_reference: gatewayReference,
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
        console.warn(`[Babimo Webhook] Échec webhook marchand: ${err?.message ?? err}`);
      }
    }
  } catch (err: any) {
    console.error("[Babimo Webhook] Erreur traitement:", err?.message ?? err);
  }
});

router.get("/webhooks/babimo", (_req: any, res: any) => {
  res.json({
    service: "DrimPay",
    webhook: "babimo",
    status: "ready",
    configured: isAnyBabimoConfigured(),
    timestamp: new Date().toISOString(),
  });
});

export default router;