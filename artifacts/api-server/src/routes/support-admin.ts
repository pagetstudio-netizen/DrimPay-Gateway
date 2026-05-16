import { Router, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  supportUsersTable,
  supportRepliesTable,
  supportSettingsTable,
  contactSubmissionsTable,
  socialLinksTable,
  globalBannersTable,
} from "@workspace/db/schema";
import { eq, desc, count, and, gte, sql } from "drizzle-orm";
import { sendSupportReplyEmail } from "../lib/mailer";

const router = Router();

// ── Auth middleware ─────────────────────────────────────────────────────────

const requireSupportAuth: RequestHandler = (req, res, next) => {
  if (!req.session.supportAdminId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  next();
};

const requirePasswordChanged: RequestHandler = async (req, res, next) => {
  if (!req.session.supportAdminId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const [u] = await db.select({ mustChangePassword: supportUsersTable.mustChangePassword })
    .from(supportUsersTable).where(eq(supportUsersTable.id, req.session.supportAdminId));
  if (u?.mustChangePassword) { res.status(403).json({ error: "must_change_password" }); return; }
  next();
};

// ── Auth routes ─────────────────────────────────────────────────────────────

router.post("/support-admin/login", async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides" }); return; }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(supportUsersTable).where(eq(supportUsersTable.email, email));
  if (!user) { res.status(401).json({ error: "Email ou mot de passe incorrect" }); return; }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) { res.status(401).json({ error: "Email ou mot de passe incorrect" }); return; }
  req.session.supportAdminId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name, mustChangePassword: user.mustChangePassword });
});

router.post("/support-admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get("/support-admin/me", requireSupportAuth, async (req, res) => {
  const [u] = await db.select({ id: supportUsersTable.id, email: supportUsersTable.email, name: supportUsersTable.name, mustChangePassword: supportUsersTable.mustChangePassword })
    .from(supportUsersTable).where(eq(supportUsersTable.id, req.session.supportAdminId!));
  if (!u) { res.status(404).json({ error: "Not found" }); return; }
  res.json(u);
});

router.patch("/support-admin/change-password", requireSupportAuth, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Au moins 8 caractères"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalide" }); return; }
  const [user] = await db.select().from(supportUsersTable).where(eq(supportUsersTable.id, req.session.supportAdminId!));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) { res.status(401).json({ error: "Mot de passe actuel incorrect" }); return; }
  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(supportUsersTable).set({ passwordHash: hash, mustChangePassword: false }).where(eq(supportUsersTable.id, user.id));
  res.json({ success: true });
});

// ── Stats ───────────────────────────────────────────────────────────────────

router.get("/support-admin/stats", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [total] = await db.select({ c: count() }).from(contactSubmissionsTable);
  const [unread] = await db.select({ c: count() }).from(contactSubmissionsTable).where(eq(contactSubmissionsTable.ticketStatus, "unread"));
  const [inProgress] = await db.select({ c: count() }).from(contactSubmissionsTable).where(eq(contactSubmissionsTable.ticketStatus, "in_progress"));
  const [replied] = await db.select({ c: count() }).from(contactSubmissionsTable).where(eq(contactSubmissionsTable.ticketStatus, "replied"));
  const [closed] = await db.select({ c: count() }).from(contactSubmissionsTable).where(eq(contactSubmissionsTable.ticketStatus, "closed"));
  const [todayCount] = await db.select({ c: count() }).from(contactSubmissionsTable).where(gte(contactSubmissionsTable.submittedAt, today));

  // Last 7 days per day
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0);
  const daily = await db.execute(sql`
    SELECT date_trunc('day', submitted_at) AS day, count(*)::int AS cnt
    FROM contact_submissions
    WHERE submitted_at >= ${sevenDaysAgo}
    GROUP BY day ORDER BY day ASC
  `);

  const recentMessages = await db.select().from(contactSubmissionsTable)
    .orderBy(desc(contactSubmissionsTable.submittedAt)).limit(5);

  res.json({
    total: Number(total.c),
    unread: Number(unread.c),
    inProgress: Number(inProgress.c),
    replied: Number(replied.c),
    closed: Number(closed.c),
    today: Number(todayCount.c),
    openTickets: Number(unread.c) + Number(inProgress.c),
    daily: daily.rows,
    recentMessages,
  });
});

// ── Messages ────────────────────────────────────────────────────────────────

router.get("/support-admin/messages", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const { status, source, search } = req.query as Record<string, string>;
  const page = Math.max(1, parseInt(req.query.page as string ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = db.select().from(contactSubmissionsTable).$dynamic();
  const conditions = [];
  if (status && status !== "all") conditions.push(eq(contactSubmissionsTable.ticketStatus, status));
  if (source && source !== "all") conditions.push(eq(contactSubmissionsTable.source, source));
  if (search) {
    conditions.push(sql`(
      ${contactSubmissionsTable.name} ILIKE ${'%' + search + '%'} OR
      ${contactSubmissionsTable.email} ILIKE ${'%' + search + '%'} OR
      ${contactSubmissionsTable.subject} ILIKE ${'%' + search + '%'}
    )`);
  }
  if (conditions.length) query = query.where(and(...conditions));
  const messages = await query.orderBy(desc(contactSubmissionsTable.submittedAt)).limit(limit).offset(offset);

  const [totalRow] = await db.select({ c: count() }).from(contactSubmissionsTable)
    .where(conditions.length ? and(...conditions) : undefined);
  res.json({ messages, total: Number(totalRow.c), page, pages: Math.ceil(Number(totalRow.c) / limit) });
});

router.get("/support-admin/messages/:id", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [msg] = await db.select().from(contactSubmissionsTable).where(eq(contactSubmissionsTable.id, id));
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  const replies = await db.select({
    id: supportRepliesTable.id,
    body: supportRepliesTable.body,
    sentAt: supportRepliesTable.sentAt,
    agentName: supportUsersTable.name,
    agentEmail: supportUsersTable.email,
  })
    .from(supportRepliesTable)
    .leftJoin(supportUsersTable, eq(supportRepliesTable.supportUserId, supportUsersTable.id))
    .where(eq(supportRepliesTable.contactId, id))
    .orderBy(supportRepliesTable.sentAt);
  res.json({ ...msg, replies });
});

router.patch("/support-admin/messages/:id/status", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const schema = z.object({ status: z.enum(["unread", "in_progress", "replied", "closed"]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Statut invalide" }); return; }
  await db.update(contactSubmissionsTable).set({ ticketStatus: parsed.data.status }).where(eq(contactSubmissionsTable.id, id));
  res.json({ success: true });
});

router.post("/support-admin/messages/:id/reply", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const schema = z.object({ body: z.string().min(1, "Le message ne peut pas être vide") });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message }); return; }
  const [msg] = await db.select().from(contactSubmissionsTable).where(eq(contactSubmissionsTable.id, id));
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  const [agent] = await db.select({ name: supportUsersTable.name, email: supportUsersTable.email })
    .from(supportUsersTable).where(eq(supportUsersTable.id, req.session.supportAdminId!));
  const [reply] = await db.insert(supportRepliesTable).values({
    contactId: id,
    supportUserId: req.session.supportAdminId!,
    body: parsed.data.body,
  }).returning();
  await db.update(contactSubmissionsTable).set({ ticketStatus: "replied" }).where(eq(contactSubmissionsTable.id, id));
  sendSupportReplyEmail({
    to: msg.email,
    recipientName: msg.name,
    subject: msg.subject,
    replyBody: parsed.data.body,
    agentName: agent?.name ?? "Support DrimPay",
  }).catch(() => {});
  res.json({ success: true, reply });
});

// ── Settings ────────────────────────────────────────────────────────────────

const SUPPORT_SETTING_KEYS = ["support_whatsapp", "support_email_1", "support_email_2", "support_hours", "support_telegram"];

router.get("/support-admin/settings", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const rows = await db.select().from(supportSettingsTable);
  const map = Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
  res.json(map);
});

router.patch("/support-admin/settings", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const updates = req.body as Record<string, string>;
  for (const key of SUPPORT_SETTING_KEYS) {
    if (key in updates) {
      await db.insert(supportSettingsTable)
        .values({ key, value: updates[key] ?? "", updatedAt: new Date() })
        .onConflictDoUpdate({ target: supportSettingsTable.key, set: { value: updates[key] ?? "", updatedAt: new Date() } });
    }
  }
  res.json({ success: true });
});

// ── Social Links ─────────────────────────────────────────────────────────────

router.get("/support-admin/socials", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const links = await db.select().from(socialLinksTable).orderBy(socialLinksTable.sortOrder);
  res.json(links);
});

router.patch("/support-admin/socials/:id", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const schema = z.object({ url: z.string(), active: z.boolean().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalide" }); return; }
  await db.update(socialLinksTable).set({ url: parsed.data.url, ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}), updatedAt: new Date() }).where(eq(socialLinksTable.id, id));
  res.json({ success: true });
});

// ── Global Banners ───────────────────────────────────────────────────────────

const bannerSchema = z.object({
  message: z.string().min(1).max(500),
  color: z.string().default("blue"),
  customColor: z.string().optional(),
  buttonText: z.string().max(60).optional(),
  buttonLink: z.string().optional(),
  active: z.boolean().default(true),
});

router.get("/support-admin/global-banners", requireSupportAuth, requirePasswordChanged, async (_req, res) => {
  const rows = await db.select().from(globalBannersTable).orderBy(desc(globalBannersTable.createdAt));
  res.json(rows);
});

router.post("/support-admin/global-banners", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides" }); return; }
  const [banner] = await db.insert(globalBannersTable).values(parsed.data).returning();
  res.json(banner);
});

router.patch("/support-admin/global-banners/:id/toggle", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select().from(globalBannersTable).where(eq(globalBannersTable.id, id));
  if (!existing) { res.status(404).json({ error: "Bannière introuvable" }); return; }
  const [updated] = await db.update(globalBannersTable)
    .set({ active: !existing.active, updatedAt: new Date() })
    .where(eq(globalBannersTable.id, id))
    .returning();
  res.json(updated);
});

router.delete("/support-admin/global-banners/:id", requireSupportAuth, requirePasswordChanged, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select({ id: globalBannersTable.id }).from(globalBannersTable).where(eq(globalBannersTable.id, id));
  if (!existing) { res.status(404).json({ error: "Bannière introuvable" }); return; }
  await db.delete(globalBannersTable).where(eq(globalBannersTable.id, id));
  res.json({ success: true });
});

// ── Public: get support settings (for landing page/footer) ──────────────────
router.get("/support/config", async (req, res) => {
  const rows = await db.select().from(supportSettingsTable);
  const map = Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
  res.json(map);
});

export default router;
