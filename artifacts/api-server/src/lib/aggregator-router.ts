/**
 * ─── Aggregator Router ────────────────────────────────────────────────────────
 *
 * Fonction centrale qui détermine quel agrégateur (Clapay ou PayDunya) doit
 * traiter un paiement en consultant la table operator_aggregators.
 *
 * Logique :
 *   1. Cherche l'entrée operator_aggregators pour (countryCode, operatorName)
 *   2. Si trouvée → utilise l'agrégateur configuré (clapay | paydunya)
 *   3. Sinon → fallback sur ACTIVE_AGGREGATOR env var
 *   4. Vérifie que l'agrégateur est disponible (configuré + actif)
 */

import { db } from "@workspace/db";
import { operatorAggregatorsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { getClapayClient, isClapayConfigured, ClapayClient } from "./clapay";
import { getPayDunyaClient, isPayDunyaConfigured, PayDunyaClient } from "./paydunya";

export type AggregatorCode = "clapay" | "paydunya";

export interface RouteResult {
  aggregator: AggregatorCode;
  client: ClapayClient | PayDunyaClient;
  opAgg: { aggregatorCode: string; active: boolean; maintenanceMode: boolean } | null;
}

export class AggregatorNotConfiguredError extends Error {
  constructor(public readonly aggregator: AggregatorCode) {
    super(`Agrégateur "${aggregator}" non configuré. Vérifiez les secrets dans Replit.`);
    this.name = "AggregatorNotConfiguredError";
  }
}

export class AggregatorUnavailableError extends Error {
  constructor(public readonly aggregator: AggregatorCode, reason: string) {
    super(`Agrégateur "${aggregator}" indisponible : ${reason}`);
    this.name = "AggregatorUnavailableError";
  }
}

/**
 * Résout l'agrégateur à utiliser pour un opérateur donné.
 * Retourne le client prêt à l'emploi et le code agrégateur.
 */
export async function resolveAggregator(
  countryCode: string,
  operatorName: string,
): Promise<RouteResult> {
  // 1. Lookup operator_aggregators
  const [opAgg] = await db
    .select()
    .from(operatorAggregatorsTable)
    .where(
      and(
        eq(operatorAggregatorsTable.countryCode, countryCode),
        eq(operatorAggregatorsTable.operatorName, operatorName),
      ),
    );

  // 2. Determine target aggregator code
  let aggregatorCode: AggregatorCode;

  if (opAgg) {
    // Operator explicitly routed
    const code = opAgg.aggregatorCode.toLowerCase();
    if (code !== "clapay" && code !== "paydunya") {
      throw new AggregatorUnavailableError(
        code as AggregatorCode,
        `Code agrégateur inconnu: "${opAgg.aggregatorCode}"`,
      );
    }
    aggregatorCode = code;
  } else {
    // Fallback: env var ACTIVE_AGGREGATOR
    const preferred = (process.env.ACTIVE_AGGREGATOR ?? "clapay").toLowerCase();
    if (preferred !== "clapay" && preferred !== "paydunya") {
      throw new AggregatorUnavailableError(
        "clapay",
        `ACTIVE_AGGREGATOR invalide: "${preferred}"`,
      );
    }
    aggregatorCode = preferred;
  }

  // 3. Get the matching client
  if (aggregatorCode === "clapay") {
    if (!isClapayConfigured()) {
      throw new AggregatorNotConfiguredError("clapay");
    }
    return { aggregator: "clapay", client: getClapayClient(), opAgg: opAgg ?? null };
  } else {
    if (!isPayDunyaConfigured()) {
      throw new AggregatorNotConfiguredError("paydunya");
    }
    return { aggregator: "paydunya", client: getPayDunyaClient(), opAgg: opAgg ?? null };
  }
}

/**
 * Initie un pay-in via l'agrégateur résolu pour cet opérateur.
 * Retourne le résultat normalisé.
 */
export interface NormalizedPayinResult {
  aggregator: AggregatorCode;
  externalRef: string;
  paymentUrl: string | null;
  ussdCode: string | null;
  message: string;
}

export interface NormalizedPayoutResult {
  aggregator: AggregatorCode;
  externalRef: string;
  message: string;
}

export interface PayinParams {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  order_id: string;
  callback_url: string;
  description?: string;
}

export interface PayoutParams {
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  description?: string;
  callback_url: string;
}

export async function routePayin(params: PayinParams): Promise<NormalizedPayinResult> {
  const { aggregator, client } = await resolveAggregator(params.country_code, params.operator);

  if (aggregator === "clapay") {
    const c = client as ClapayClient;
    const res = await c.initiatePayin(params);
    if (!res.success) {
      throw new Error(res.message ?? "Échec Clapay payin");
    }
    return {
      aggregator,
      externalRef: res.clapay_reference,
      paymentUrl: res.payment_url ?? null,
      ussdCode: res.ussd_code ?? null,
      message: "Prompt de paiement envoyé via Clapay",
    };
  } else {
    const p = client as PayDunyaClient;
    const res = await p.initiatePayin(params);
    if (!res.success) {
      throw new Error(res.message ?? "Échec PayDunya payin");
    }
    return {
      aggregator,
      externalRef: res.paydunya_reference,
      paymentUrl: res.payment_url ?? null,
      ussdCode: null,
      message: "Prompt de paiement envoyé via PayDunya",
    };
  }
}

// ─── Normalized status check result ──────────────────────────────────────────
export interface StatusCheckResult {
  status: "pending" | "processing" | "success" | "failed" | "expired" | "cancelled";
  gatewayReference: string;
  failureReason?: string;
}

function mapPayDunyaStatus(s: string): StatusCheckResult["status"] {
  const u = (s ?? "").toLowerCase();
  if (u === "completed" || u === "success" || u === "paid") return "success";
  if (u === "failed" || u === "error" || u === "rejected" || u === "declined") return "failed";
  if (u === "cancelled" || u === "canceled") return "cancelled";
  if (u === "expired") return "expired";
  if (u === "processing" || u === "initiated") return "processing";
  return "pending";
}

/**
 * Vérifie le statut réel d'une transaction chez le fournisseur après initiation.
 * Retourne null en cas d'erreur (le webhook prendra le relais).
 */
export async function checkStatusAfterInit(
  aggregator: AggregatorCode,
  client: ClapayClient | PayDunyaClient,
  gatewayRef: string,
): Promise<StatusCheckResult | null> {
  if (!gatewayRef) return null;
  try {
    if (aggregator === "clapay") {
      const r = await (client as ClapayClient).getStatus(gatewayRef);
      return {
        status: r.status,
        gatewayReference: r.clapay_reference || gatewayRef,
        failureReason: r.failure_reason,
      };
    } else {
      const r = await (client as PayDunyaClient).getStatus(gatewayRef);
      return {
        status: mapPayDunyaStatus(r.status),
        gatewayReference: r.paydunya_reference || gatewayRef,
        failureReason: r.failure_reason,
      };
    }
  } catch (err: any) {
    console.warn(`[StatusCheck] Impossible de vérifier le statut ${aggregator}/${gatewayRef}: ${err.message}`);
    return null;
  }
}

export async function routePayout(params: PayoutParams): Promise<NormalizedPayoutResult> {
  const { aggregator, client } = await resolveAggregator(params.country_code, params.operator);

  if (aggregator === "clapay") {
    const c = client as ClapayClient;
    const res = await c.initiatePayout(params);
    if (!res.success) {
      throw new Error(res.message ?? "Échec Clapay payout");
    }
    return {
      aggregator,
      externalRef: res.clapay_reference,
      message: "Payout envoyé via Clapay",
    };
  } else {
    const p = client as PayDunyaClient;
    const res = await p.initiatePayout(params);
    if (!res.success) {
      throw new Error(res.message ?? "Échec PayDunya payout");
    }
    return {
      aggregator,
      externalRef: res.paydunya_reference,
      message: "Payout envoyé via PayDunya",
    };
  }
}
