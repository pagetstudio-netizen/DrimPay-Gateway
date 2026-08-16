import { Router } from "express";
import { db } from "@workspace/db";
import { adminSettingsTable } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";

const router = Router();

// Public endpoint — returns the platform-wide default fee rates
// (controlled by admin via admin_settings keys default_payin_fee_percent / default_payout_fee_percent)
router.get("/fees", async (_req, res) => {
  try {
    const rows = await db
      .select({ key: adminSettingsTable.key, value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(inArray(adminSettingsTable.key, ["default_payin_fee_percent", "default_payout_fee_percent"]));
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    const payin  = parseFloat(map["default_payin_fee_percent"]  ?? "3.5");
    const payout = parseFloat(map["default_payout_fee_percent"] ?? "3.5");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ payin, payout, payin_display: `${payin}%`, payout_display: `${payout}%` });
  } catch {
    res.json({ payin: 3.5, payout: 3.5, payin_display: "3.5%", payout_display: "3.5%" });
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
