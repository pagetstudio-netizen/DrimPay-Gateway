import { Router } from "express";
import { db } from "@workspace/db";
import { partnersTable } from "@workspace/db";

const router = Router();

router.get("/partners", async (req, res) => {
  try {
    const partners = await db.select().from(partnersTable);
    res.json(
      partners.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        country: p.country,
        logoUrl: p.logoUrl,
        description: p.description,
        website: p.website,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list partners");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
