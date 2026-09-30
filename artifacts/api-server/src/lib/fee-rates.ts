import { db } from "@workspace/db";
import { adminSettingsTable, usersTable } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";

export type FeeType = "payin" | "payout";
export type OperatorFeeOverride = {
  payin: number | null;
  payout: number | null;
};
export type OperatorFeeRates = Record<string, OperatorFeeOverride>;
export type CountryFeeDefault = { payin: number | null; payout: number | null };
export type CountryFeeDefaults = Record<string, CountryFeeDefault>;

const DEFAULT_FEE_RATE = 0.035;
export const OPERATOR_FEE_RATES_SETTING = "operator_fee_rates";
export const COUNTRY_FEE_RATES_SETTING = "country_fee_rates";
const SPECIAL_COUNTRY_DEFAULTS: CountryFeeDefault = { payin: 4.5, payout: 4.5 };

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

export function parseCountryFeeDefaults(raw: string | null | undefined): CountryFeeDefaults {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: CountryFeeDefaults = {};
    for (const [country, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const item = value as Record<string, unknown>;
      result[country.trim().toUpperCase()] = {
        payin: validPercent(item.payin) ? item.payin : null,
        payout: validPercent(item.payout) ? item.payout : null,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function defaultCountryFee(countryCode: string, type: FeeType, defaults: CountryFeeDefaults = {}): number | null {
  const configured = defaults[countryCode.trim().toUpperCase()];
  const configuredRate = configured?.[type];
  if (configuredRate !== null && configuredRate !== undefined) return configuredRate / 100;
  return ["TG", "SN", "ML"].includes(countryCode.trim().toUpperCase()) ? SPECIAL_COUNTRY_DEFAULTS[type]! / 100 : null;
}

async function getPlatformDefaultFee(type: FeeType, settings?: { key: string; value: string | null }[]): Promise<number> {
  const key = type === "payin" ? "default_payin_fee_percent" : "default_payout_fee_percent";
  const rows = settings ?? await db.select({ key: adminSettingsTable.key, value: adminSettingsTable.value })
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.key, key));
  const row = rows.find(r => r.key === key) ?? rows[0];
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
  const legacyKey = type === "payin" ? "payin_fee_percent" : "payout_fee_percent";
  const [[user], platformSettings, [operatorSetting], [countrySetting]] = await Promise.all([
    db
      .select({
        payinFeePercent: usersTable.payinFeePercent,
        payoutFeePercent: usersTable.payoutFeePercent,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId)),
    db
      .select({ key: adminSettingsTable.key, value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(or(eq(adminSettingsTable.key, feeKey), eq(adminSettingsTable.key, legacyKey))),
    db.select({ value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, OPERATOR_FEE_RATES_SETTING))
      .limit(1),
    db.select({ value: adminSettingsTable.value })
      .from(adminSettingsTable).where(eq(adminSettingsTable.key, COUNTRY_FEE_RATES_SETTING)).limit(1),
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

  const countryRate = countryCode ? defaultCountryFee(countryCode, type, parseCountryFeeDefaults(countrySetting?.value)) : null;
  if (countryRate !== null && countryRate !== undefined) return countryRate;
  return getPlatformDefaultFee(type, platformSettings);
}