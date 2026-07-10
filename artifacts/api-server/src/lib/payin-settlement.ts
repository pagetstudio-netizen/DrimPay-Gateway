/**
 * ─── Payin Settlement (idempotent) ─────────────────────────────────────────
 *
 * Point unique qui applique un statut définitif à une transaction payin et,
 * si succès, crédite le wallet. Utilisé à la fois par :
 *   - le polling synchrone juste après l'initiation (pay.ts, dashboard.ts)
 *   - le webhook PayDunya / Clapay (confirmation asynchrone du fournisseur)
 *
 * Idempotence : la mise à jour DB n'a d'effet que si la transaction n'est pas
 * déjà "success" (clause SQL atomique `status <> 'success'`). Si le polling a
 * déjà crédité le wallet, le webhook qui arrive plus tard ne recrédite pas ;
 * si le webhook arrive avant la fin du polling, c'est l'inverse.
 */

import { db } from "@workspace/db";
import { transactionsTable, walletsTable, usersTable } from "@workspace/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { notifyPayinConfirmed } from "./telegram";

export type SettledStatus = "pending" | "processing" | "success" | "failed" | "cancelled" | "expired";

export interface SettlePayinParams {
  txId: number;
  status: SettledStatus;
  gatewayReference?: string;
  failureReason?: string;
  gateway: "clapay" | "paydunya";
}

/**
 * Applique le statut à la transaction. Si le statut passe à "success" et que
 * la transaction n'était pas déjà "success", crédite le wallet et notifie.
 * Retourne true si un crédit a réellement eu lieu (utile pour les logs).
 */
export async function settlePayinStatus(params: SettlePayinParams): Promise<{ credited: boolean }> {
  const { txId, status, gatewayReference, failureReason, gateway } = params;

  const dbStatus = status === "success" ? "success" : status;

  // ── Transition de statut + crédit du wallet dans UNE SEULE transaction DB ──
  // Si le process/la DB tombe entre les deux écritures, tout est annulé (rollback) :
  // la transaction ne reste jamais bloquée "success" sans que le wallet soit crédité.
  const updated = await db.transaction(async (trx) => {
    const [row] = await trx
      .update(transactionsTable)
      .set({
        status: dbStatus as any,
        ...(gatewayReference ? { externalRef: gatewayReference } : {}),
        ...(failureReason ? { failureReason } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(transactionsTable.id, txId), ne(transactionsTable.status, "success")))
      .returning();

    if (!row || status !== "success") {
      return row ?? null;
    }

    await trx
      .update(walletsTable)
      .set({ balance: sql`${walletsTable.balance} + ${row.netAmount}` })
      .where(eq(walletsTable.id, row.walletId));

    return row;
  });

  if (!updated) {
    console.log(`[Settlement] Transaction #${txId} déjà réglée en "success" — statut "${status}" ignoré (idempotence)`);
    return { credited: false };
  }

  if (status !== "success") {
    return { credited: false };
  }

  console.log(
    `[Settlement] ✓ Wallet ${updated.walletId} crédité de ${updated.netAmount} ${updated.currency} ` +
    `(ref ${updated.reference}, gateway ${gateway}, gatewayRef ${gatewayReference ?? updated.externalRef ?? "?"})`,
  );

  try {
    const [merchant] = await db
      .select({ companyName: usersTable.companyName })
      .from(usersTable)
      .where(eq(usersTable.id, updated.userId));

    const source = updated.reference.startsWith("PL-") ? "link" : updated.reference.startsWith("QR-") ? "qr" : "api";
    notifyPayinConfirmed({
      company: merchant?.companyName ?? "?",
      amount: parseFloat(updated.amount),
      fee: parseFloat(updated.fee),
      net: parseFloat(updated.netAmount),
      currency: updated.currency,
      operator: updated.operator,
      phone: updated.phone,
      country: updated.countryCode,
      reference: updated.reference,
      mode: updated.mode,
      source,
      gateway,
    }).catch(() => {});
  } catch (err: any) {
    console.warn(`[Settlement] Notification Telegram échouée: ${err?.message}`);
  }

  return { credited: true };
}
