import { Router } from "express";

const router = Router();

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
