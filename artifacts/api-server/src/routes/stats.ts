import { Router } from "express";
import { db } from "@workspace/db";
import { adminSettingsTable, operatorsTable } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";
import {
  COUNTRY_FEE_RATES_SETTING, OPERATOR_FEE_RATES_SETTING,
  operatorFeeConfigKey, parseCountryFeeDefaults, parseOperatorFeeRates, defaultCountryFee,
} from "../lib/fee-rates";

const router = Router();

// Public endpoint — returns the platform-wide default fee rates
// (controlled by admin via admin_settings keys default_payin_fee_percent / default_payout_fee_percent)
router.get("/fees", async (_req, res) => {
  try {
    const [rows, operators] = await Promise.all([db
      .select({ key: adminSettingsTable.key, value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(inArray(adminSettingsTable.key, [
        "default_payin_fee_percent", "default_payout_fee_percent", "payin_fee_percent", "payout_fee_percent",
        COUNTRY_FEE_RATES_SETTING, OPERATOR_FEE_RATES_SETTING,
      ])), db.select().from(operatorsTable).where(inArray(operatorsTable.active, [true]))]);
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    const numberSetting = (key: string, legacy: string) => {
      const value = map[key] ?? map[legacy] ?? "3.5";
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 3.5;
    };
    const payin = numberSetting("default_payin_fee_percent", "payin_fee_percent");
    const payout = numberSetting("default_payout_fee_percent", "payout_fee_percent");
    const countryDefaults = parseCountryFeeDefaults(map[COUNTRY_FEE_RATES_SETTING]);
    const overrides = parseOperatorFeeRates(map[OPERATOR_FEE_RATES_SETTING]);
    const countryRates = operators.map(operator => {
      const key = operatorFeeConfigKey(operator.countryCode, operator.name);
      const override = overrides[key];
      const countryPayin = defaultCountryFee(operator.countryCode, "payin", countryDefaults);
      const countryPayout = defaultCountryFee(operator.countryCode, "payout", countryDefaults);
      return {
        countryCode: operator.countryCode,
        operator: operator.name,
        payin: override?.payin ?? (countryPayin === null ? payin : countryPayin * 100),
        payout: override?.payout ?? (countryPayout === null ? payout : countryPayout * 100),
      };
    });
    res.setHeader("Cache-Control", "no-store");
    res.json({ payin, payout, payin_display: `${payin}%`, payout_display: `${payout}%`, countryRates });
  } catch {
    res.status(503).json({ error: "Impossible de charger le barème des frais.", countryRates: [] });
  }
});

router.get("/stats/platform", async (req, res) => {
  res.json({
    totalTransactions: 4_820_341,
    totalVolume: "$2.4B",
    supportedCountries: 7,
    activePartners: 28,
    uptimePercent: 99.97,
    merchantsOnboarded: 3_200,
  });
});

export default router;
