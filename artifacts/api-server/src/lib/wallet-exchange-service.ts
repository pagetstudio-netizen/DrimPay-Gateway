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

  const applied = await db.transaction(async (trx) => {
    // Libère la réservation (lockedBalance) du wallet source et débite définitivement.
    const [fromRow] = await trx
      .update(walletsTable)
      .set({ lockedBalance: sql`${walletsTable.lockedBalance} - ${amount}` })
      .where(and(eq(walletsTable.id, exchange.fromWalletId), sql`${walletsTable.lockedBalance} >= ${amount}`))
      .returning();
    if (!fromRow) return false;

    await trx
      .update(walletsTable)
      .set({ balance: sql`${walletsTable.balance} + ${net}` })
      .where(eq(walletsTable.id, exchange.toWalletId));

    const [updated] = await trx
      .update(walletExchangesTable)
      .set({ status: "approved", reviewedBy: actor, reviewedAt: new Date() })
      .where(and(eq(walletExchangesTable.id, id), eq(walletExchangesTable.status, "pending")))
      .returning();

    return !!updated;
  });

  if (!applied) return { ok: false, error: "Échec de l'approbation (fonds insuffisants ou déjà traité)." };

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

  const applied = await db.transaction(async (trx) => {
    // Libère la réservation : les fonds retournent au solde disponible du wallet source.
    await trx
      .update(walletsTable)
      .set({
        lockedBalance: sql`${walletsTable.lockedBalance} - ${amount}`,
        balance: sql`${walletsTable.balance} + ${amount}`,
      })
      .where(eq(walletsTable.id, exchange.fromWalletId));

    const [updated] = await trx
      .update(walletExchangesTable)
      .set({ status: "rejected", rejectionReason: reason, reviewedBy: actor, reviewedAt: new Date() })
      .where(and(eq(walletExchangesTable.id, id), eq(walletExchangesTable.status, "pending")))
      .returning();

    return !!updated;
  });

  if (!applied) return { ok: false, error: "Échec du rejet (déjà traité)." };

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
