import { Router } from "express";
import { db } from "@workspace/db";
import { countriesTable, operatorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/countries", async (req, res) => {
  try {
    const countries = await db.select().from(countriesTable);
    const operators = await db.select().from(operatorsTable);

    const result = countries.map((c) => ({
      code: c.code,
      name: c.name,
      flag: c.flag,
      currency: c.currency,
      payinEnabled: c.payinEnabled,
      payoutEnabled: c.payoutEnabled,
      operators: operators
        .filter((o) => o.countryCode === c.code)
        .map((o) => ({ name: o.name, type: o.type, active: o.active })),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list countries");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
