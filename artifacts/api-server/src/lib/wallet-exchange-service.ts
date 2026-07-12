// ─── Wallet Exchange — logique partagée (routes admin + callbacks Telegram) ────
// Centralise l'approbation/rejet d'une demande d'échange entre wallets d'un même
// marchand (même zone monétaire) afin d'éviter la duplication entre le panel
// admin et le bot Telegram, qui doivent tous deux pouvoir approuver/rejeter.

import { db } from "@workspace/db";
import { walletExchangesTable, walletsTable, usersTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendWalletExchangeApprovedEmail, sendWalletExchangeRejectedEmail } from "./mailer";

type Result = { ok: boolean; error?: string };

async function createExchangeNotification(
  userId: number,
  type: "success" | "error",
  title: string,
  body: string,
): Promise<void> {
  try {
    const { notificationsTable } = await import("@workspace/db/schema");
    await db.insert(notificationsTable).values({
      userId, type, category: "wallet", title, body, href: "/dashboard/wallet-exchange",
    });
  } catch { /* ignore */ }
}

export async function approveWalletExchange(id: number, actor: string): Promise<Result> {
  const [exchange] = await db.select().from(walletExchangesTable).where(eq(walletExchangesTable.id, id));
  if (!exchange) return { ok: false, error: "Demande introuvable." };
  if (exchange.status !== "pending") return { ok: false, error: "Cette demande a déjà été traitée." };

  const amount = parseFloat(exchange.amount as string);
  const net = parseFloat(exchange.netAmount as string);

  // La transition de statut est le verrou : un seul UPDATE concurrent peut passer de
  // "pending" → "approved". Si la ligne a déjà été traitée, l'UPDATE retourne 0 lignes
  // et on lève une erreur pour déclencher le rollback automatique de la transaction.
  // Le crédit destination n'intervient qu'APRÈS confirmation du verrou.
  try {
    await db.transaction(async (trx) => {
      const [updated] = await trx
        .update(walletExchangesTable)
        .set({ status: "approved", reviewedBy: actor, reviewedAt: new Date() })
        .where(and(eq(walletExchangesTable.id, id), eq(walletExchangesTable.status, "pending")))
        .returning();
      if (!updated) throw new Error("ALREADY_PROCESSED");

      await trx
        .update(walletsTable)
        .set({ balance: sql`${walletsTable.balance} + ${net}` })
        .where(eq(walletsTable.id, exchange.toWalletId));
    });
  } catch (err: any) {
    if (err.message === "ALREADY_PROCESSED") return { ok: false, error: "Cette demande a déjà été traitée." };
    throw err;
  }

  try {
    const [user] = await db.select({ email: usersTable.email, companyName: usersTable.companyName })
      .from(usersTable).where(eq(usersTable.id, exchange.userId));
    if (user) {
      await createExchangeNotification(
        exchange.userId, "success",
        `Échange approuvé — ${exchange.fromCountryCode} → ${exchange.toCountryCode}`,
        `Votre échange de ${amount.toLocaleString("fr-FR")} ${exchange.currency} a été approuvé. Montant net crédité : ${net.toLocaleString("fr-FR")} ${exchange.currency}.`,
      );
      sendWalletExchangeApprovedEmail({
        to: user.email, companyName: user.companyName,
        fromCountry: exchange.fromCountryCode, toCountry: exchange.toCountryCode,
        amount, fee: parseFloat(exchange.fee as string), net, currency: exchange.currency,
        reference: exchange.reference ?? String(exchange.id),
      }).catch(() => {});
    }
  } catch { /* ignore notification errors */ }

  return { ok: true };
}

export async function rejectWalletExchange(id: number, reason: string, actor: string): Promise<Result> {
  const [exchange] = await db.select().from(walletExchangesTable).where(eq(walletExchangesTable.id, id));
  if (!exchange) return { ok: false, error: "Demande introuvable." };
  if (exchange.status !== "pending") return { ok: false, error: "Cette demande a déjà été traitée." };

  const amount = parseFloat(exchange.amount as string);

  // Même verrou que l'approbation : la transition de statut passe en premier.
  // Si l'échange est déjà traité, l'UPDATE retourne 0 lignes → rollback automatique.
  // Le remboursement source n'intervient qu'APRÈS confirmation du verrou.
  try {
    await db.transaction(async (trx) => {
      const [updated] = await trx
        .update(walletExchangesTable)
        .set({ status: "rejected", rejectionReason: reason, reviewedBy: actor, reviewedAt: new Date() })
        .where(and(eq(walletExchangesTable.id, id), eq(walletExchangesTable.status, "pending")))
        .returning();
      if (!updated) throw new Error("ALREADY_PROCESSED");

      await trx
        .update(walletsTable)
        .set({ balance: sql`${walletsTable.balance} + ${amount}` })
        .where(eq(walletsTable.id, exchange.fromWalletId));
    });
  } catch (err: any) {
    if (err.message === "ALREADY_PROCESSED") return { ok: false, error: "Cette demande a déjà été traitée." };
    throw err;
  }

  try {
    const [user] = await db.select({ email: usersTable.email, companyName: usersTable.companyName })
      .from(usersTable).where(eq(usersTable.id, exchange.userId));
    if (user) {
      await createExchangeNotification(
        exchange.userId, "error",
        `Échange refusé — ${exchange.fromCountryCode} → ${exchange.toCountryCode}`,
        `Votre demande d'échange de ${amount.toLocaleString("fr-FR")} ${exchange.currency} a été refusée. Motif : ${reason}. Les fonds ont été recrédités sur votre wallet ${exchange.fromCountryCode}.`,
      );
      sendWalletExchangeRejectedEmail({
        to: user.email, companyName: user.companyName,
        fromCountry: exchange.fromCountryCode, toCountry: exchange.toCountryCode,
        amount, currency: exchange.currency, reason,
      }).catch(() => {});
    }
  } catch { /* ignore notification errors */ }

  return { ok: true };
}
