/**
 * Babimo notification handler.
 *
 * Babimo does not document a signing header in the supplied collection, so this
 * endpoint intentionally does not invent one. It correlates by the merchant
 * transaction id first and falls back to the provider reference.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { MERCHANT_FAILURE_LABEL } from "../lib/merchant-error";
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

const MAX_SCAN_DEPTH = 6;

function findDeepValue(root: unknown, keys: Set<string>, depth = 0): string {
  if (depth > MAX_SCAN_DEPTH || root === null || root === undefined) return "";
  if (Array.isArray(root)) {
    for (const value of root) {
      const found = findDeepValue(value, keys, depth + 1);
      if (found) return found;
    }
    return "";
  }
  if (typeof root !== "object") return "";

  for (const [key, value] of Object.entries(root as Record<string, unknown>)) {
    if (keys.has(key.toLowerCase())) {
      const found = firstString(value);
      if (found) return found;
    }
  }
  for (const value of Object.values(root as Record<string, unknown>)) {
    const found = findDeepValue(value, keys, depth + 1);
    if (found) return found;
  }
  return "";
}

function hasDeepKey(root: unknown, keys: Set<string>, depth = 0): boolean {
  if (depth > MAX_SCAN_DEPTH || root === null || root === undefined) return false;
  if (Array.isArray(root)) return root.some(value => hasDeepKey(value, keys, depth + 1));
  if (typeof root !== "object") return false;
  return Object.entries(root as Record<string, unknown>).some(([key, value]) =>
    keys.has(key.toLowerCase()) || hasDeepKey(value, keys, depth + 1),
  );
}

function maskIdentifier(value: string): string {
  if (!value) return "absent";
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.min(value.length - 4, 12))}${value.slice(-4)}`;
}

function webhookShape(root: unknown, depth = 0): string[] {
  if (depth > 3 || root === null || typeof root !== "object") return [];
  if (Array.isArray(root)) return root.flatMap(value => webhookShape(value, depth + 1)).slice(0, 30);
  const entries = Object.entries(root as Record<string, unknown>);
  const keys = entries.map(([key, value]) => {
    if (value && typeof value === "object") return `${key}{${webhookShape(value, depth + 1).join(",")}}`;
    return key;
  });
  return keys.slice(0, 30);
}

function normalizeStatus(value: string): "pending" | "processing" | "success" | "failed" | "cancelled" | "expired" {
  switch (value.toLowerCase().trim().replace(/[\s-]+/g, "_")) {
    case "success":
    case "successful":
    case "successfull":
    case "completed":
    case "paid":
    case "approved":
    case "done":
      return "success";
    case "failed":
    case "error":
    case "rejected":
    case "declined":
    case "refused":
      return "failed";
    case "cancelled":
    case "canceled":
    case "cancel":
      return "cancelled";
    case "expired":
      return "expired";
    case "processing":
    case "initiated":
    case "in_progress":
    case "inprogress":
    case "waiting":
    case "created":
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
    const merchantReferenceKeys = new Set([
      "merchant_transaction_id",
      "merchant_reference",
      "merchanttransactionid",
      "order_id",
      "orderid",
      "drimpay_reference",
    ]);
    const genericReferenceKeys = new Set(["reference", "transaction_reference"]);
    const providerReferenceKeys = new Set([
      "status_token",
      "statustoken",
      "pay_token",
      "paytoken",
      "partner_transaction_id",
      "partnertransactionid",
      "babimo_reference",
      "transaction_id",
      "transactionid",
      "token",
    ]);
    const statusKeys = new Set([
      "status",
      "statut",
      "state",
      "transaction_status",
      "transactionstatus",
      "payment_status",
      "paymentstatus",
    ]);

    // `refercence_cl` is the stable Babimo account reference, not the
    // merchant transaction reference. It is intentionally only diagnosed,
    // never used to correlate a transaction.
    const reference = firstString(
      findDeepValue(body, merchantReferenceKeys),
      findDeepValue(body, genericReferenceKeys),
    );
    const providerReference = findDeepValue(body, providerReferenceKeys);
    const statusValue = findDeepValue(body, statusKeys);
    const clientReferencePresent = hasDeepKey(body, new Set(["refercence_cl"]));

    console.info("[Babimo Webhook] Notification reçue", {
      method: req.method,
      contentType: req.get("content-type") ?? null,
      userAgent: req.get("user-agent") ?? null,
      forwardedFor: req.get("x-forwarded-for") ?? null,
      bodyType: Array.isArray(body) ? "array" : typeof body,
      bodyKeys: webhookShape(body),
      merchantReference: maskIdentifier(reference),
      providerReference: maskIdentifier(providerReference),
      clientReferencePresent,
      status: statusValue || "absent",
    });
    const status = normalizeStatus(statusValue);
    const failureReason = firstString(
      findDeepValue(body, new Set(["message", "error", "description", "response_text"])),
    ) || null;

    if (!reference && !providerReference) {
      console.warn("[Babimo Webhook] Référence de transaction/token absente — notification ignorée", {
        clientReferencePresent,
      });
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
      console.warn("[Babimo Webhook] Transaction introuvable", {
        merchantReference: maskIdentifier(reference),
        providerReference: maskIdentifier(providerReference),
      });
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
      console.log(`[Babimo Webhook] Payin ${maskIdentifier(tx.reference)} → ${status} (crédité: ${result.credited})`);
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
        failure_reason: ["failed", "cancelled", "expired"].includes(status) ? MERCHANT_FAILURE_LABEL : null,
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