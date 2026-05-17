import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import { usersTable, apiKeysTable, passwordResetTokensTable } from "@workspace/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { notifyNewUser, notifyAdminLogin } from "../lib/telegram";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../lib/mailer";
import {
  logSecurityEvent,
  trackFailedLogin,
  clearFailedLogins,
  loginRateLimiter,
  signupRateLimiter,
} from "../middlewares/security";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  country: z.string().min(1),
  accountType: z.enum(["enterprise", "personal"]).default("enterprise"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/signup", signupRateLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { email, password, companyName, country, accountType } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const merchantCode = crypto.randomBytes(3).toString("hex");
  const [user] = await db.insert(usersTable).values({ email, passwordHash, companyName, country, merchantCode, accountType }).returning();

  req.session.userId = user.id;
  req.session.role = user.role;

  // Auto-generate sandbox API key on signup
  try {
    const rawKey = `dp_test_${crypto.randomBytes(24).toString("hex")}`;
    const prefix = rawKey.substring(0, 12);
    const keyHash = await bcrypt.hash(rawKey, 10);
    await db.insert(apiKeysTable).values({
      userId: user.id,
      name: "Clé Sandbox",
      keyHash,
      prefix,
      env: "sandbox",
    });
  } catch (e) {
    console.error("[DrimPay] Failed to auto-generate sandbox key at signup:", e);
  }

  // Security log
  await logSecurityEvent({ eventType: "REGISTER", req, userId: user.id, details: `Nouveau compte : ${email}`, riskLevel: "low" });

  notifyNewUser(user.email, user.companyName, user.country).catch(() => {});
  sendWelcomeEmail({ to: user.email, companyName: user.companyName }).catch(() => {});

  res.status(201).json({
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    country: user.country,
    role: user.role,
    accountType: user.accountType,
    merchantCode: user.merchantCode,
  });
});

router.post("/auth/login", loginRateLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    const ip = req.ip ?? "unknown";
    const isBrute = trackFailedLogin(ip);
    await logSecurityEvent({
      eventType: isBrute ? "BRUTE_FORCE" : "LOGIN_FAILED",
      req,
      details: `Email inconnu : ${email}`,
      riskLevel: isBrute ? "high" : "medium",
    });
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const ip = req.ip ?? "unknown";
    const isBrute = trackFailedLogin(ip);
    await logSecurityEvent({
      eventType: isBrute ? "BRUTE_FORCE" : "LOGIN_FAILED",
      req,
      userId: user.id,
      details: `Mot de passe incorrect pour : ${email}`,
      riskLevel: isBrute ? "high" : "medium",
    });
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  clearFailedLogins(req.ip ?? "unknown");
  req.session.userId = user.id;
  req.session.role = user.role;

  await logSecurityEvent({
    eventType: "LOGIN_SUCCESS",
    req,
    userId: user.id,
    details: `Connexion réussie : ${email}`,
    riskLevel: "low",
  });

  if (user.role === "admin") {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "?";
    notifyAdminLogin(user.email, ip).catch(() => {});
  }

  res.json({
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    country: user.country,
    role: user.role,
    accountType: user.accountType,
    merchantCode: user.merchantCode,
  });
});

router.post("/auth/logout", async (req, res) => {
  if (req.session.userId) {
    await logSecurityEvent({ eventType: "LOGOUT", req, userId: req.session.userId, riskLevel: "low" });
  }
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Adresse email invalide." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);

  // Always respond OK to avoid user enumeration
  if (!user) {
    res.json({ ok: true, message: "Si ce compte existe, un email a été envoyé." });
    return;
  }

  // Generate 5-digit code and URL-safe token
  const code = String(Math.floor(10000 + Math.random() * 90000));
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(passwordResetTokensTable).values({
    userId: user.id,
    email: user.email,
    code,
    token,
    expiresAt,
  });

  const baseUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "https://drimpay.com";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const { sendPasswordResetEmail } = await import("../lib/mailer");
  const mailResult = await sendPasswordResetEmail({
    to: user.email,
    companyName: user.companyName,
    code,
    resetLink,
  });

  if (!mailResult.ok) {
    console.warn("[Auth] Email reset non envoyé:", mailResult.error);
    // Still return ok — admins can check logs. Don't expose SMTP config status.
  }

  res.json({ ok: true, message: "Si ce compte existe, un email a été envoyé." });
});

router.post("/auth/verify-reset-code", async (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    res.status(400).json({ error: "Email et code requis." });
    return;
  }

  const now = new Date();
  const [record] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.email, email.toLowerCase().trim()),
        eq(passwordResetTokensTable.code, code.trim()),
        gt(passwordResetTokensTable.expiresAt, now),
        isNull(passwordResetTokensTable.usedAt),
      )
    )
    .orderBy(passwordResetTokensTable.createdAt)
    .limit(1);

  if (!record) {
    res.status(400).json({ error: "Code invalide ou expiré." });
    return;
  }

  res.json({ ok: true, token: record.token });
});

router.post("/auth/reset-password", async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: "Token et nouveau mot de passe (8 caractères min.) requis." });
    return;
  }

  const now = new Date();
  const [record] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token),
        gt(passwordResetTokensTable.expiresAt, now),
        isNull(passwordResetTokensTable.usedAt),
      )
    )
    .limit(1);

  if (!record) {
    res.status(400).json({ error: "Lien invalide ou expiré. Veuillez recommencer la procédure." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, record.userId));
  await db.update(passwordResetTokensTable).set({ usedAt: now }).where(eq(passwordResetTokensTable.id, record.id));

  await logSecurityEvent({ eventType: "PASSWORD_RESET", req, userId: record.userId, riskLevel: "medium" });

  res.json({ ok: true, message: "Mot de passe réinitialisé avec succès." });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (!req.session.mode) req.session.mode = "sandbox";

  res.json({
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    country: user.country,
    role: user.role,
    accountType: user.accountType,
    merchantCode: user.merchantCode,
    mode: req.session.mode,
  });
});

export default router;
