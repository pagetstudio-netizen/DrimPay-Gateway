/**
 * ─── Aggregator Router ────────────────────────────────────────────────────────
 *
 * Fonction centrale qui détermine quel agrégateur (Clapay, PayDunya ou Babimo) doit
 * traiter un paiement en consultant la table operator_aggregators.
 *
 * Logique :
 *   1. Cherche l'entrée operator_aggregators pour (countryCode, operatorName)
 *   2. Si trouvée → utilise l'agrégateur configuré (clapay | paydunya | babimo)
 *   3. Sinon → fallback sur ACTIVE_AGGREGATOR env var
 *   4. Vérifie que l'agrégateur est disponible (configuré + actif)
 */

import { db } from "@workspace/db";
import { operatorAggregatorsTable, operatorsTable, adminSettingsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { getClapayClient, isClapayConfigured, ClapayClient } from "./clapay";
import { getPayDunyaClient, isPayDunyaConfigured, PayDunyaClient } from "./paydunya";
import { getBabimoClient, isBabimoConfigured, BabimoClient } from "./babimo";

export type AggregatorCode = "clapay" | "paydunya" | "babimo";

/**
 * Normalise un nom d'opérateur en "slug" comparable, pour faire correspondre
 * les slugs utilisés par l'API publique (ex: "tmoney", "orange", "mtn") avec
 * les noms canoniques stockés en base (ex: "TMoney", "Orange Money", "MTN
 * Mobile Money"). Sans cette normalisation, un appel API respectant la
 * documentation (slugs en minuscules) ne correspond à aucune ligne exacte en
 * base et TOUS les opérateurs remontent comme indisponibles.
 */
function operatorSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/mobile\s*money/g, "")
    .replace(/momo/g, "")
    .replace(/money/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Trouve la ligne `operators` correspondant à un pays + un nom/slug
 * d'opérateur, en comparant les slugs normalisés plutôt qu'une égalité
 * stricte sur le nom canonique.
 */
async function findOperatorBySlug(countryCode: string, operatorName: string) {
  const rows = await db
    .select()
    .from(operatorsTable)
    .where(eq(operatorsTable.countryCode, countryCode));
  const slug = operatorSlug(operatorName);
  return rows.find(r => operatorSlug(r.name) === slug) ?? null;
}

/**
 * Idem pour `operator_aggregators`, avec le nom canonique déjà résolu
 * (évite une seconde normalisation ambiguë : on matche sur le nom exact
 * renvoyé par `findOperatorBySlug`).
 */
async function findOperatorAggregatorByCanonicalName(countryCode: string, canonicalName: string) {
  const [row] = await db
    .select()
    .from(operatorAggregatorsTable)
    .where(and(
      eq(operatorAggregatorsTable.countryCode, countryCode),
      eq(operatorAggregatorsTable.operatorName, canonicalName),
    ));
  return row ?? null;
}

export interface RouteResult {
  aggregator: AggregatorCode;
  client: ClapayClient | PayDunyaClient | BabimoClient;
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
  operation: "payin" | "payout" = "payin",
): Promise<RouteResult> {
  const matchedOperator = await findOperatorBySlug(countryCode, operatorName);
  const opAgg = matchedOperator
    ? await findOperatorAggregatorByCanonicalName(countryCode, matchedOperator.name)
    : null;

  let aggregatorCode: AggregatorCode;
  // true = operator is explicitly mapped in DB; false = using ACTIVE_AGGREGATOR fallback
  const explicitMapping = !!opAgg;

  if (opAgg) {
    const code = opAgg.aggregatorCode.toLowerCase();
    if (code !== "clapay" && code !== "paydunya" && code !== "babimo") {
      throw new AggregatorUnavailableError(
        code as AggregatorCode,
        `Code agrégateur inconnu: "${opAgg.aggregatorCode}"`,
      );
    }
    aggregatorCode = code;
  } else {
    const preferred = (process.env.ACTIVE_AGGREGATOR ?? "paydunya").toLowerCase();
    if (preferred !== "clapay" && preferred !== "paydunya" && preferred !== "babimo") {
      throw new AggregatorUnavailableError(
        "paydunya",
        `ACTIVE_AGGREGATOR invalide: "${preferred}"`,
      );
    }
    aggregatorCode = preferred;
  }

  // ── Résolution finale avec fallback intelligent ────────────────────────────
  // Si l'agrégateur choisi est configuré (a ses clés API), on l'utilise.
  // Si ce n'est PAS le cas et qu'il n'y a PAS de mapping explicite en base,
  // on bascule automatiquement vers l'autre agrégateur s'il est disponible.
  // Un mapping explicite en base (opAgg) ne peut pas être ignoré — il faut
  // que l'opérateur soit correctement configuré.
  if (aggregatorCode === "clapay") {
    if (isClapayConfigured()) {
      return { aggregator: "clapay", client: getClapayClient(), opAgg: opAgg ?? null };
    }
    // Clapay non configuré — fallback automatique sur PayDunya puis Babimo si pas de mapping explicite
    if (!explicitMapping && isPayDunyaConfigured()) {
      console.warn(
        `[AggregatorRouter] Clapay non configuré (CLAPAY_API_TOKEN manquant) — ` +
        `bascule automatique sur PayDunya pour ${operatorName} (${countryCode}).`,
      );
      return { aggregator: "paydunya", client: getPayDunyaClient(), opAgg: null };
    }
    if (!explicitMapping && isBabimoConfigured()) {
      console.warn(
        `[AggregatorRouter] Clapay non configuré — bascule automatique sur Babimo pour ${operatorName} (${countryCode}).`,
      );
      return { aggregator: "babimo", client: getBabimoClient(), opAgg: null };
    }
    throw new AggregatorNotConfiguredError("clapay");
  } else if (aggregatorCode === "paydunya") {
    if (isPayDunyaConfigured()) {
      return { aggregator: "paydunya", client: getPayDunyaClient(), opAgg: opAgg ?? null };
    }
    // PayDunya non configuré — fallback automatique sur Babimo puis Clapay si pas de mapping explicite
    if (!explicitMapping && isBabimoConfigured()) {
      console.warn(
        `[AggregatorRouter] PayDunya non configuré — bascule automatique sur Babimo pour ${operatorName} (${countryCode}).`,
      );
      return { aggregator: "babimo", client: getBabimoClient(), opAgg: null };
    }
    if (!explicitMapping && isClapayConfigured()) {
      console.warn(
        `[AggregatorRouter] PayDunya non configuré (clés manquantes) — ` +
        `bascule automatique sur Clapay pour ${operatorName} (${countryCode}).`,
      );
      return { aggregator: "clapay", client: getClapayClient(), opAgg: null };
    }
    throw new AggregatorNotConfiguredError("paydunya");
  } else {
    if (isBabimoConfigured()) {
      return { aggregator: "babimo", client: getBabimoClient(), opAgg: opAgg ?? null };
    }
    if (!explicitMapping && isPayDunyaConfigured()) {
      console.warn(
        `[AggregatorRouter] Babimo non configuré — bascule automatique sur PayDunya pour ${operatorName} (${countryCode}).`,
      );
      return { aggregator: "paydunya", client: getPayDunyaClient(), opAgg: null };
    }
    if (!explicitMapping && isClapayConfigured()) {
      console.warn(
        `[AggregatorRouter] Babimo non configuré — bascule automatique sur Clapay pour ${operatorName} (${countryCode}).`,
      );
      return { aggregator: "clapay", client: getClapayClient(), opAgg: null };
    }
    throw new AggregatorNotConfiguredError("babimo");
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
  return_url?: string;
  operator_otp?: string;
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
  client: ClapayClient | PayDunyaClient | BabimoClient,
  gatewayRef: string,
  operation: "payin" | "payout" = "payin",
): Promise<StatusCheckResult> {
  if (aggregator === "clapay") {
    const r = await (client as ClapayClient).getStatus(gatewayRef);
    return {
      status: r.status,
      gatewayReference: r.clapay_reference || gatewayRef,
      failureReason: r.failure_reason,
    };
  } else if (aggregator === "paydunya") {
    // PayDunya payouts use the disbursement check-status endpoint (disburse_token)
    // PayDunya payins use the checkout-invoice confirm endpoint (payment_token)
    const pd = client as PayDunyaClient;
    const r = operation === "payout"
      ? await pd.getPayoutStatus(gatewayRef)
      : await pd.getStatus(gatewayRef);
    return {
      status: mapPayDunyaStatus(r.status),
      gatewayReference: r.paydunya_reference || gatewayRef,
      failureReason: r.failure_reason,
    };
  } else {
    const r = await (client as BabimoClient).getStatus(gatewayRef);
    return {
      status: r.status,
      gatewayReference: r.babimo_reference || gatewayRef,
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
  client: ClapayClient | PayDunyaClient | BabimoClient,
  gatewayRef: string,
  options?: {
    intervalMs?: number;
    maxDurationMs?: number;
    operation?: "payin" | "payout";
  },
): Promise<StatusCheckResult | null> {
  if (!gatewayRef) return null;

  const intervalMs    = options?.intervalMs    ?? 3_000;
  const maxDurationMs = options?.maxDurationMs ?? 25_000;
  const operation     = options?.operation     ?? "payin";
  const deadline      = Date.now() + maxDurationMs;
  let lastResult: StatusCheckResult | null = null;
  let attempt = 0;

  // First check after a short initial wait (fournisseur peut déjà avoir une réponse)
  await sleep(Math.min(intervalMs, 2_000));

  while (Date.now() < deadline) {
    attempt++;
    try {
      const result = await fetchStatus(aggregator, client, gatewayRef, operation);
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
  client: ClapayClient | PayDunyaClient | BabimoClient,
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

// ─── Operator / Platform availability check ───────────────────────────────────

export type BlockKind = "deposits" | "withdrawals" | "api" | "paymentLinks";

/**
 * Vérifie si un opérateur est disponible pour un type d'opération donné.
 * Consulte :
 *   1. La table `operators` (actif global)
 *   2. La table `operator_aggregators` (maintenance, blockDeposits, blockWithdrawals…)
 *   3. Le réglage admin `platform_block_withdrawals` (kill-switch global retraits)
 */
export async function checkOperatorAvailable(
  countryCode: string,
  operatorName: string,
  blockKind: BlockKind,
): Promise<{ ok: false; error: string; status: number } | { ok: true }> {
  // 1. Kill-switch global : retraits bloqués sur toute la plateforme
  if (blockKind === "withdrawals") {
    try {
      const [setting] = await db
        .select({ value: adminSettingsTable.value })
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.key, "platform_block_withdrawals"));
      if (setting?.value === "true") {
        return {
          ok: false,
          status: 503,
          error: "Les retraits sont temporairement suspendus sur toute la plateforme. Veuillez réessayer ultérieurement.",
        };
      }
    } catch { /* ignore — ne bloque pas si la table est inaccessible */ }
  }

  // 2. Opérateur global désactivé
  const op = await findOperatorBySlug(countryCode, operatorName);

  if (!op || !op.active) {
    return { ok: false, status: 503, error: "Opérateur indisponible pour le moment." };
  }

  // 3. Restrictions spécifiques à l'agrégateur (maintenance, blockX)
  const opAgg = await findOperatorAggregatorByCanonicalName(countryCode, op.name);

  if (opAgg) {
    if (opAgg.maintenanceMode) {
      return { ok: false, status: 503, error: "Cet opérateur est actuellement en maintenance. Veuillez réessayer plus tard." };
    }
    if (!opAgg.active) {
      return { ok: false, status: 503, error: "Opérateur indisponible pour le moment." };
    }
    if (blockKind === "deposits" && opAgg.blockDeposits) {
      return { ok: false, status: 503, error: "Les dépôts sont temporairement bloqués pour cet opérateur." };
    }
    if (blockKind === "withdrawals" && opAgg.blockWithdrawals) {
      return { ok: false, status: 503, error: "Les retraits sont temporairement bloqués pour cet opérateur." };
    }
    if (blockKind === "api" && opAgg.blockApi) {
      return { ok: false, status: 503, error: "Les paiements API sont temporairement bloqués pour cet opérateur." };
    }
    if (blockKind === "paymentLinks" && opAgg.blockPaymentLinks) {
      return { ok: false, status: 503, error: "Les liens de paiement sont temporairement bloqués pour cet opérateur." };
    }
  }

  return { ok: true };
}

/**
 * Liste les opérateurs réellement disponibles pour un pays donné : actifs
 * dans `operators` ET non bloqués/en maintenance pour les liens de paiement
 * dans `operator_aggregators`. Utilisé pour ne jamais afficher au client un
 * opérateur que l'admin a désactivé (QR codes, liens de paiement).
 */
export async function listActiveOperators(countryCode: string): Promise<string[]> {
  const ops = await db
    .select({ name: operatorsTable.name })
    .from(operatorsTable)
    .where(and(eq(operatorsTable.countryCode, countryCode), eq(operatorsTable.active, true)));

  if (ops.length === 0) return [];

  const aggs = await db
    .select()
    .from(operatorAggregatorsTable)
    .where(eq(operatorAggregatorsTable.countryCode, countryCode));

  const aggByName = new Map(aggs.map(a => [a.operatorName, a]));

  return ops
    .filter(op => {
      const agg = aggByName.get(op.name);
      if (!agg) return true; // pas de restriction spécifique configurée
      return agg.active && !agg.maintenanceMode && !agg.blockPaymentLinks;
    })
    .map(op => op.name);
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
  } else if (aggregator === "paydunya") {
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
  } else {
    const b = client as BabimoClient;
    const res = await b.initiatePayin(params);
    if (!res.success) throw new Error(res.message ?? "Échec Babimo payin");
    return {
      aggregator,
      externalRef: res.babimo_reference,
      paymentUrl: res.payment_url ?? null,
      ussdCode: null,
      message: "Paiement initié via Babimo",
    };
  }
}

export async function routePayout(params: PayoutParams): Promise<NormalizedPayoutResult> {
  const { aggregator, client } = await resolveAggregator(params.country_code, params.operator, "payout");

  if (aggregator === "clapay") {
    const c = client as ClapayClient;
    const res = await c.initiatePayout(params);
    if (!res.success) throw new Error(res.message ?? "Échec Clapay payout");
    return {
      aggregator,
      externalRef: res.clapay_reference,
      message: "Payout envoyé via Clapay",
    };
  } else if (aggregator === "paydunya") {
    const p = client as PayDunyaClient;
    const res = await p.initiatePayout(params);
    if (!res.success) throw new Error(res.message ?? "Échec PayDunya payout");
    return {
      aggregator,
      externalRef: res.paydunya_reference,
      message: "Payout envoyé via PayDunya",
    };
  } else {
    const b = client as BabimoClient;
    const res = await b.initiatePayout(params);
    if (!res.success) throw new Error(res.message ?? "Échec Babimo payout");
    return {
      aggregator,
      externalRef: res.babimo_reference,
      message: "Payout envoyé via Babimo",
    };
  }
}
