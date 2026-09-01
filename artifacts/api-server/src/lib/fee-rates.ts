import { db } from "@workspace/db";
import { adminSettingsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export type FeeType = "payin" | "payout";
export type OperatorFeeOverride = {
  payin: number | null;
  payout: number | null;
};
export type OperatorFeeRates = Record<string, OperatorFeeOverride>;

const DEFAULT_FEE_RATE = 0.035;
export const OPERATOR_FEE_RATES_SETTING = "operator_fee_rates";

function validPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function normalizeOperatorForFee(value: string): string {
  return value
    .toLowerCase()
    .replace(/mobile\s*money/g, "")
    .replace(/momo/g, "")
    .replace(/money/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function operatorFeeConfigKey(countryCode: string, operator: string): string {
  return `${countryCode.trim().toUpperCase()}:${normalizeOperatorForFee(operator)}`;
}

export function parseOperatorFeeRates(raw: string | null | undefined): OperatorFeeRates {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const result: OperatorFeeRates = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const item = value as Record<string, unknown>;
      result[key] = {
        payin: validPercent(item.payin) ? item.payin : null,
        payout: validPercent(item.payout) ? item.payout : null,
      };
    }
    return result;
  } catch {
    return {};
  }
}

async function getPlatformDefaultFee(type: FeeType): Promise<number> {
  const key = type === "payin" ? "default_payin_fee_percent" : "default_payout_fee_percent";
  const [row] = await db
    .select({ value: adminSettingsTable.value })
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.key, key))
    .limit(1);
  const value = row?.value ? parseFloat(row.value) / 100 : DEFAULT_FEE_RATE;
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : DEFAULT_FEE_RATE;
}

/**
 * Resolves the fee at transaction creation time. An explicit merchant
 * override remains more specific than the platform operator/country rule.
 */
export async function getFeeRate(
  userId: number,
  type: FeeType,
  countryCode?: string,
  operator?: string,
): Promise<number> {
  const feeKey = type === "payin" ? "default_payin_fee_percent" : "default_payout_fee_percent";
  const [[user], [platformSetting], [operatorSetting]] = await Promise.all([
    db
      .select({
        payinFeePercent: usersTable.payinFeePercent,
        payoutFeePercent: usersTable.payoutFeePercent,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId)),
    db
      .select({ value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, feeKey))
      .limit(1),
    countryCode && operator
      ? db
          .select({ value: adminSettingsTable.value })
          .from(adminSettingsTable)
          .where(eq(adminSettingsTable.key, OPERATOR_FEE_RATES_SETTING))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const merchantPercent = type === "payin" ? user?.payinFeePercent : user?.payoutFeePercent;
  if (merchantPercent !== null && merchantPercent !== undefined) {
    const merchantRate = parseFloat(String(merchantPercent)) / 100;
    if (Number.isFinite(merchantRate) && merchantRate >= 0 && merchantRate <= 1) return merchantRate;
  }

  if (countryCode && operator && operatorSetting?.value) {
    const configured = parseOperatorFeeRates(operatorSetting.value)[operatorFeeConfigKey(countryCode, operator)];
    const operatorPercent = configured?.[type];
    if (operatorPercent !== null && operatorPercent !== undefined) return operatorPercent / 100;
  }

  const platformPercent = platformSetting?.value ? parseFloat(platformSetting.value) / 100 : DEFAULT_FEE_RATE;
  return Number.isFinite(platformPercent) && platformPercent >= 0 && platformPercent <= 1
    ? platformPercent
    : await getPlatformDefaultFee(type);
}