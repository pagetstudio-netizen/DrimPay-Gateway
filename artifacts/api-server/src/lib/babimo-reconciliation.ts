/**
 * Durable fallback for Babimo callbacks.
 *
 * Babimo may complete a mobile-money payment after the short HTTP polling
 * window, and some provider flows do not reliably deliver notify_url. This
 * worker only examines transactions that were explicitly routed to Babimo,
 * then uses the stored provider reference and the same idempotent settlement
 * path as the webhook.
 */

import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db/schema";
import { and, desc, eq, inArray, isNotNull, like } from "drizzle-orm";
import { getBabimoClient } from "./babimo";
import { settlePayinStatus } from "./payin-settlement";

const RECONCILIATION_INTERVAL_MS = 30_000;
const MAX_TRANSACTIONS_PER_RUN = 50;

let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function isBabimoSnapshot(snapshot: string | null): boolean {
  if (!snapshot) return false;
  try {
    const parsed = JSON.parse(snapshot) as { gateway?: unknown };
    return parsed.gateway === "babimo";
  } catch {
    return snapshot.includes('"gateway":"babimo"') || snapshot.includes('"gateway": "babimo"');
  }
}

async function reconcileOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const candidates = await db
      .select()
      .from(transactionsTable)
      .where(and(
        eq(transactionsTable.type, "payin"),
        inArray(transactionsTable.status, ["queued", "pending", "processing"]),
        isNotNull(transactionsTable.externalRef),
        like(transactionsTable.gatewayPayload, '%"gateway"%babimo%'),
      ))
      .orderBy(desc(transactionsTable.updatedAt))
      .limit(MAX_TRANSACTIONS_PER_RUN);

    const babimoTransactions = candidates.filter(tx => isBabimoSnapshot(tx.gatewayPayload));
    if (babimoTransactions.length > 0) {
      console.info(`[Babimo Reconciliation] ${babimoTransactions.length} transaction(s) à vérifier`);
    }

    for (const tx of babimoTransactions) {
      if (!tx.externalRef) continue;
      try {
        const client = getBabimoClient(tx.countryCode);
        const result = await client.getStatus(tx.externalRef);
        const settled = await settlePayinStatus({
          txId: tx.id,
          status: result.status,
          gatewayReference: result.babimo_reference || tx.externalRef,
          failureReason: result.failure_reason,
          gateway: "babimo",
        });
        console.info(
          `[Babimo Reconciliation] ${tx.reference} → ${result.status} (crédité: ${settled.credited})`,
        );
      } catch (err: any) {
        // A transient provider/database error must not mark a payment failed.
        console.warn(
          `[Babimo Reconciliation] Vérification échouée pour ${tx.reference}: ${err?.message ?? err}`,
        );
      }
    }
  } catch (err: any) {
    console.warn(`[Babimo Reconciliation] Lecture DB échouée: ${err?.message ?? err}`);
  } finally {
    running = false;
  }
}

export function startBabimoReconciliation(): void {
  if (timer) return;

  const run = async () => {
    await reconcileOnce();
    timer = setTimeout(run, RECONCILIATION_INTERVAL_MS);
    timer.unref?.();
  };

  // Let the HTTP server finish starting before the first provider query.
  timer = setTimeout(run, 5_000);
  timer.unref?.();
  console.info(
    `[Babimo Reconciliation] Worker démarré (intervalle ${RECONCILIATION_INTERVAL_MS / 1000}s, lot ${MAX_TRANSACTIONS_PER_RUN})`,
  );
}
