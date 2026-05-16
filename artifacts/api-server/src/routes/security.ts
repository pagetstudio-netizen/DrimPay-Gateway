import { Router } from "express";
import { db } from "@workspace/db";
import { securityEventsTable, blockedIpsTable, usersTable } from "@workspace/db/schema";
import { desc, eq, and, or, gt, isNull, count, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.userId || req.session?.role !== "admin") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }
  next();
}

// ── GET /admin/security/events ─────────────────────────────────────────────────
router.get("/admin/security/events", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 200);
  const offset = parseInt(String(req.query.offset ?? "0"));
  const riskLevel = req.query.riskLevel as string | undefined;
  const eventType = req.query.eventType as string | undefined;

  let query = db
    .select({
      id: securityEventsTable.id,
      eventType: securityEventsTable.eventType,
      ipAddress: securityEventsTable.ipAddress,
      userAgent: securityEventsTable.userAgent,
      details: securityEventsTable.details,
      riskLevel: securityEventsTable.riskLevel,
      createdAt: securityEventsTable.createdAt,
      userId: securityEventsTable.userId,
      userEmail: usersTable.email,
    })
    .from(securityEventsTable)
    .leftJoin(usersTable, eq(securityEventsTable.userId, usersTable.id))
    .orderBy(desc(securityEventsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const rows = await query;

  // Stats for summary cards
  const [stats] = await db
    .select({
      total: count(),
      high: sql<number>`count(*) filter (where ${securityEventsTable.riskLevel} in ('high','critical'))`,
      today: sql<number>`count(*) filter (where ${securityEventsTable.createdAt} > now() - interval '24 hours')`,
      failed: sql<number>`count(*) filter (where ${securityEventsTable.eventType} in ('LOGIN_FAILED','BRUTE_FORCE'))`,
    })
    .from(securityEventsTable);

  res.json({ events: rows, stats });
});

// ── GET /admin/security/blocked-ips ──────────────────────────────────────────
router.get("/admin/security/blocked-ips", requireAdmin, async (req, res) => {
  const rows = await db
    .select()
    .from(blockedIpsTable)
    .orderBy(desc(blockedIpsTable.createdAt));
  res.json(rows);
});

// ── POST /admin/security/block-ip ─────────────────────────────────────────────
router.post("/admin/security/block-ip", requireAdmin, async (req, res) => {
  const schema = z.object({
    ip: z.string().min(3).max(64),
    reason: z.string().min(1).max(500),
    permanent: z.boolean().default(false),
    hours: z.number().int().positive().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }

  const { ip, reason, permanent, hours } = parsed.data;
  const blockedUntil = !permanent && hours ? new Date(Date.now() + hours * 3600_000) : null;

  const [existing] = await db.select().from(blockedIpsTable).where(eq(blockedIpsTable.ip, ip));
  if (existing) {
    await db.update(blockedIpsTable)
      .set({ reason, permanent: permanent ?? false, blockedUntil, blockedBy: req.session.userId! })
      .where(eq(blockedIpsTable.ip, ip));
    res.json({ ok: true, action: "updated" });
    return;
  }

  const [row] = await db.insert(blockedIpsTable).values({
    ip,
    reason,
    permanent: permanent ?? false,
    blockedUntil,
    blockedBy: req.session.userId!,
  }).returning();

  res.status(201).json(row);
});

// ── DELETE /admin/security/blocked-ips/:id ────────────────────────────────────
router.delete("/admin/security/blocked-ips/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }
  await db.delete(blockedIpsTable).where(eq(blockedIpsTable.id, id));
  res.json({ ok: true });
});

export default router;
