import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// /api/healthz — deep check (DB ping)
router.get("/healthz", async (_req, res) => {
  const start = Date.now();
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    res.json({
      status: "ok",
      db: "ok",
      dbLatencyMs: Date.now() - start,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: "error",
      db: "unreachable",
      error: err?.message ?? "DB connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
