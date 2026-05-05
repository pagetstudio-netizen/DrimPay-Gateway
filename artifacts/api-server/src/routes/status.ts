import { Router } from "express";
import { db } from "@workspace/db";
import { serviceStatusesTable, incidentsTable } from "@workspace/db";

const router = Router();

router.get("/status/services", async (req, res) => {
  try {
    const services = await db.select().from(serviceStatusesTable);

    const overallDegraded = services.some((s) => s.status === "degraded");
    const overallOutage = services.some((s) => s.status === "outage");
    const overallMaintenance = services.some((s) => s.status === "maintenance");

    const overall = overallOutage
      ? "outage"
      : overallDegraded
      ? "degraded"
      : overallMaintenance
      ? "maintenance"
      : "operational";

    res.json({
      overall,
      services: services.map((s) => ({
        name: s.name,
        status: s.status,
        uptimePercent: s.uptimePercent / 100,
        latencyMs: s.latencyMs,
      })),
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get service statuses");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/status/incidents", async (req, res) => {
  try {
    const incidents = await db.select().from(incidentsTable);
    res.json(
      incidents.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        status: i.status,
        severity: i.severity,
        startedAt: i.startedAt.toISOString(),
        resolvedAt: i.resolvedAt?.toISOString() ?? null,
        affectedServices: i.affectedServices,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list incidents");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
