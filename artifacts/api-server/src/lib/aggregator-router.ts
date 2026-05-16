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
  const [opAgg] = await db
    .select()
    .from(operatorAggregatorsTable)
    .where(
      and(
        eq(operatorAggregatorsTable.countryCode, countryCode),
        eq(operatorAggregatorsTable.operatorName, operatorName),
      ),
    );

  let aggregatorCode: AggregatorCode;

  if (opAgg) {
    const code = opAgg.aggregatorCode.toLowerCase();
    if (code !== "clapay" && code !== "paydunya") {
      throw new AggregatorUnavailableError(
        code as AggregatorCode,
        `Code agrégateur inconnu: "${opAgg.aggregatorCode}"`,
      );
    }
    aggregatorCode = code;
  } else {
    const preferred = (process.env.ACTIVE_AGGREGATOR ?? "clapay").toLowerCase();
    if (preferred !== "clapay" && preferred !== "paydunya") {
      throw new AggregatorUnavailableError(
        "clapay",
        `ACTIVE_AGGREGATOR invalide: "${preferred}"`,
      );
    }
    aggregatorCode = preferred;
  }

  if (aggregatorCode === "clapay") {
    if (!isClapayConfigured()) throw new AggregatorNotConfiguredError("clapay");
    return { aggregator: "clapay", client: getClapayClient(), opAgg: opAgg ?? null };
  } else {
    if (!isPayDunyaConfigured()) throw new AggregatorNotConfiguredError("paydunya");
    return { aggregator: "paydunya", client: getPayDunyaClient(), opAgg: opAgg ?? null };
  }
}

// ─── Status types ─────────────────────────────────────────────────────────────

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

export interface StatusCheckResult {
  status: "pending" | "processing" | "success" | "failed" | "expired" | "cancelled";
  gatewayReference: string;
  failureReason?: string;
}

// Statuts définitifs — le fournisseur ne reviendra plus dessus
const SETTLED_STATUSES = new Set<string>(["success", "failed", "cancelled", "expired"]);

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
 * Vérification unique du statut chez le fournisseur.
 * Utilisé en interne par pollUntilSettled.
 */
async function fetchStatus(
  aggregator: AggregatorCode,
  client: ClapayClient | PayDunyaClient,
  gatewayRef: string,
): Promise<StatusCheckResult> {
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
}

/**
 * Polling du statut chez le fournisseur jusqu'à obtenir un statut définitif.
 *
 * Stratégie recommandée :
 *   - Pay-in  : intervalMs=4000, maxDurationMs=20000 (l'utilisateur doit approuver sur son téléphone)
 *   - Payout  : intervalMs=3000, maxDurationMs=30000 (automatisé, règle en quelques secondes)
 *
 * Si le délai max est atteint sans statut définitif, retourne le dernier statut connu
 * (le webhook du fournisseur confirme ensuite le statut final).
 */
export async function pollUntilSettled(
  aggregator: AggregatorCode,
  client: ClapayClient | PayDunyaClient,
  gatewayRef: string,
  options?: {
    intervalMs?: number;
    maxDurationMs?: number;
  },
): Promise<StatusCheckResult | null> {
  if (!gatewayRef) return null;

  const intervalMs    = options?.intervalMs    ?? 3_000;
  const maxDurationMs = options?.maxDurationMs ?? 25_000;
  const deadline      = Date.now() + maxDurationMs;
  let lastResult: StatusCheckResult | null = null;
  let attempt = 0;

  // First check after a short initial wait (fournisseur peut déjà avoir une réponse)
  await sleep(Math.min(intervalMs, 2_000));

  while (Date.now() < deadline) {
    attempt++;
    try {
      const result = await fetchStatus(aggregator, client, gatewayRef);
      lastResult = result;

      console.info(
        `[Poll#${attempt}] ${aggregator}/${gatewayRef} → ${result.status} (+${Date.now() - (deadline - maxDurationMs)}ms)`,
      );

      if (SETTLED_STATUSES.has(result.status)) {
        console.info(`[Poll] Settled: ${result.status}`);
        return result;
      }
    } catch (err: any) {
      console.warn(`[Poll#${attempt}] ${aggregator}/${gatewayRef} check error: ${err.message}`);
    }

    // Attendre avant la prochaine tentative si on n'a pas encore dépassé le délai
    if (Date.now() + intervalMs < deadline) {
      await sleep(intervalMs);
    } else {
      break;
    }
  }

  console.info(
    `[Poll] Timeout après ${maxDurationMs}ms — dernier statut: ${lastResult?.status ?? "null"}. Le webhook confirmera.`,
  );
  return lastResult;
}

/**
 * Compatibilité — appel unique (remplacé par pollUntilSettled dans les nouveaux endpoints).
 * Conservé pour éviter les imports cassés.
 */
export async function checkStatusAfterInit(
  aggregator: AggregatorCode,
  client: ClapayClient | PayDunyaClient,
  gatewayRef: string,
): Promise<StatusCheckResult | null> {
  if (!gatewayRef) return null;
  try {
    return await fetchStatus(aggregator, client, gatewayRef);
  } catch (err: any) {
    console.warn(`[StatusCheck] ${aggregator}/${gatewayRef}: ${err.message}`);
    return null;
  }
}

export async function routePayin(params: PayinParams): Promise<NormalizedPayinResult> {
  const { aggregator, client } = await resolveAggregator(params.country_code, params.operator);

  if (aggregator === "clapay") {
    const c = client as ClapayClient;
    const res = await c.initiatePayin(params);
    if (!res.success) throw new Error(res.message ?? "Échec Clapay payin");
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
    if (!res.success) throw new Error(res.message ?? "Échec PayDunya payin");
    return {
      aggregator,
      externalRef: res.paydunya_reference,
      paymentUrl: res.payment_url ?? null,
      ussdCode: null,
      message: "Prompt de paiement envoyé via PayDunya",
    };
  }
}

export async function routePayout(params: PayoutParams): Promise<NormalizedPayoutResult> {
  const { aggregator, client } = await resolveAggregator(params.country_code, params.operator);

  if (aggregator === "clapay") {
    const c = client as ClapayClient;
    const res = await c.initiatePayout(params);
    if (!res.success) throw new Error(res.message ?? "Échec Clapay payout");
    return {
      aggregator,
      externalRef: res.clapay_reference,
      message: "Payout envoyé via Clapay",
    };
  } else {
    const p = client as PayDunyaClient;
    const res = await p.initiatePayout(params);
    if (!res.success) throw new Error(res.message ?? "Échec PayDunya payout");
    return {
      aggregator,
      externalRef: res.paydunya_reference,
      message: "Payout envoyé via PayDunya",
    };
  }
}
