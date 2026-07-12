import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  usersTable, apiKeysTable, passwordResetTokensTable,
  emailVerificationTokensTable, knownDevicesTable,
} from "@workspace/db/schema";
import { eq, and, gt, isNull, desc } from "drizzle-orm";
import { notifyNewUser, notifyLoginAttempt } from "../lib/telegram";
import { sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerificationEmail, sendPasswordResetSupportEmail } from "../lib/mailer";
import {
  logSecurityEvent,
  trackFailedLogin,
  clearFailedLogins,
  loginRateLimiter,
  signupRateLimiter,
  emailSendRateLimiter,
  codeVerifyRateLimiter,
  resolveGeoInfo,
  getClientIp,
} from "../middlewares/security";
import { isSignupEnabled } from "../lib/admin-settings";

const router = Router();

// Account-level brute-force lockout: 5 failed attempts locks the account for
// 30 minutes, regardless of which IP/device the attempts come from.
const ACCOUNT_LOCK_THRESHOLD = 5;
const ACCOUNT_LOCK_DURATION_MS = 30 * 60 * 1000;

// A known device is only trusted for 3 days of inactivity; past that, the
// next login re-triggers the full email code + activation link flow.
const KNOWN_DEVICE_TRUST_MS = 3 * 24 * 60 * 60 * 1000;

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBaseUrl(req: import("express").Request): string {
  if (process.env["REPLIT_DEV_DOMAIN"]) return `https://${process.env["REPLIT_DEV_DOMAIN"]}`;
  return "https://drimpay.com";
}

function deviceFingerprint(req: import("express").Request, userId: number): string {
  const ua = req.headers["user-agent"] ?? "unknown";
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "0";
  const ipPrefix = ip.split(".").slice(0, 2).join(".");
  return crypto.createHash("sha256").update(`${userId}:${ua}:${ipPrefix}`).digest("hex");
}

async function generateVerificationToken(userId: number, email: string, type: "signup" | "new_device") {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await db.insert(emailVerificationTokensTable).values({ userId, email, code, token, type, expiresAt });
  return { code, token };
}

// ─── SIGNUP ───────────────────────────────────────────────────────────────────

router.post("/auth/signup", signupRateLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { email, password, companyName, country, accountType } = parsed.data;

  if (!(await isSignupEnabled())) {
    res.status(503).json({ error: "Les nouvelles inscriptions sont temporairement fermées par l'administrateur." });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const merchantCode = crypto.randomBytes(3).toString("hex");
  const [user] = await db.insert(usersTable).values({
    email, passwordHash, companyName, country, merchantCode, accountType, emailVerified: false,
  }).returning();

  // Auto-generate sandbox API key
  try {
    const rawKey = `dp_test_${crypto.randomBytes(24).toString("hex")}`;
    const prefix = rawKey.substring(0, 12);
    const keyHash = await bcrypt.hash(rawKey, 10);
    await db.insert(apiKeysTable).values({ userId: user.id, name: "Clé Sandbox", keyHash, prefix, env: "sandbox" });
  } catch (e) {
    console.error("[DrimPay] Failed to auto-generate sandbox key at signup:", e);
  }

  await logSecurityEvent({ eventType: "REGISTER", req, userId: user.id, details: `Nouveau compte : ${email}`, riskLevel: "low" });
  notifyNewUser(user.email, user.companyName, user.country).catch(() => {});

  // Send verification email (6-digit code + activation link)
  try {
    const { code, token } = await generateVerificationToken(user.id, user.email, "signup");
    const activationLink = `${getBaseUrl(req)}/api/auth/activate?token=${token}`;
    await sendEmailVerificationEmail({ to: user.email, companyName: user.companyName, code, activationLink, type: "signup" });
  } catch (e) {
    console.error("[Auth] Failed to send verification email:", e);
  }

  res.status(202).json({ requiresVerification: true, email: user.email });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

router.post("/auth/login", loginRateLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = parsed.data;

  const ip = getClientIp(req);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    const isBrute = trackFailedLogin(ip);
    await logSecurityEvent({ eventType: isBrute ? "BRUTE_FORCE" : "LOGIN_FAILED", req, details: `Email inconnu : ${email}`, riskLevel: isBrute ? "high" : "medium" });
    // Fire-and-forget geo + notification
    resolveGeoInfo(ip).then(geo => {
      notifyLoginAttempt({ type: "failed", email, role: "merchant", ip, country: geo.country, isVpn: geo.isVpn, isHosting: geo.isHosting, org: geo.org }).catch(() => {});
    }).catch(() => {});
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  // Account-level lockout — applies regardless of IP/device, so switching
  // phones or networks does not bypass it. Cleared automatically once
  // accountLockedUntil elapses.
  if (user.accountLockedUntil && user.accountLockedUntil.getTime() > Date.now()) {
    const remainingMs = user.accountLockedUntil.getTime() - Date.now();
    await logSecurityEvent({ eventType: "LOGIN_FAILED", req, userId: user.id, details: `Tentative sur compte verrouillé : ${email}`, riskLevel: "high" });
    res.status(423).json({
      error: "Compte temporairement bloqué suite à trop de tentatives. Réessayez dans 30 minutes.",
      lockedUntil: user.accountLockedUntil.toISOString(),
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
    });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const isBrute = trackFailedLogin(ip);
    const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
    const shouldLock = newAttempts >= ACCOUNT_LOCK_THRESHOLD;
    await db.update(usersTable).set({
      failedLoginAttempts: shouldLock ? 0 : newAttempts,
      accountLockedUntil: shouldLock ? new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS) : null,
    }).where(eq(usersTable.id, user.id));

    await logSecurityEvent({
      eventType: isBrute || shouldLock ? "BRUTE_FORCE" : "LOGIN_FAILED",
      req, userId: user.id,
      details: shouldLock
        ? `Compte verrouillé 30 min après ${ACCOUNT_LOCK_THRESHOLD} tentatives échouées : ${email}`
        : `Mot de passe incorrect pour : ${email} (${newAttempts}/${ACCOUNT_LOCK_THRESHOLD})`,
      riskLevel: shouldLock ? "high" : (isBrute ? "high" : "medium"),
    });
    resolveGeoInfo(ip).then(geo => {
      notifyLoginAttempt({ type: "failed", email, role: user.role === "admin" ? "admin" : "merchant", ip, country: geo.country, isVpn: geo.isVpn, isHosting: geo.isHosting, org: geo.org, userId: user.id }).catch(() => {});
    }).catch(() => {});

    if (shouldLock) {
      res.status(423).json({
        error: "Trop de tentatives incorrectes. Votre compte est bloqué pendant 30 minutes.",
        lockedUntil: new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS).toISOString(),
        retryAfterSeconds: Math.ceil(ACCOUNT_LOCK_DURATION_MS / 1000),
      });
      return;
    }

    res.status(401).json({ error: "Email ou mot de passe incorrect.", attemptsRemaining: ACCOUNT_LOCK_THRESHOLD - newAttempts });
    return;
  }

  clearFailedLogins(ip);

  // Successful password check clears the account's failed-attempt counter.
  if ((user.failedLoginAttempts ?? 0) > 0 || user.accountLockedUntil) {
    await db.update(usersTable).set({ failedLoginAttempts: 0, accountLockedUntil: null }).where(eq(usersTable.id, user.id));
  }

  // Check if email is verified (existing users without the column treated as verified)
  if (user.emailVerified === false) {
    // Resend verification code
    try {
      const { code, token } = await generateVerificationToken(user.id, user.email, "signup");
      const activationLink = `${getBaseUrl(req)}/api/auth/activate?token=${token}`;
      await sendEmailVerificationEmail({ to: user.email, companyName: user.companyName, code, activationLink, type: "signup" });
    } catch (e) {
      console.error("[Auth] Failed to resend verification email:", e);
    }
    res.status(202).json({ requiresVerification: true, email: user.email, reason: "email_not_verified" });
    return;
  }

  // Check known device fingerprint. A match only counts if it was seen
  // within the last 3 days — otherwise treat it like a brand-new device.
  const hash = deviceFingerprint(req, user.id);
  let knownDevice: { id: number; lastSeenAt: Date }[] = [];
  try {
    knownDevice = await db.select({ id: knownDevicesTable.id, lastSeenAt: knownDevicesTable.lastSeenAt })
      .from(knownDevicesTable)
      .where(and(eq(knownDevicesTable.userId, user.id), eq(knownDevicesTable.deviceHash, hash)))
      .limit(1);
  } catch {
    // Table may not exist yet — treat as known device to avoid blocking all logins
    knownDevice = [{ id: 0, lastSeenAt: new Date() }];
  }

  const deviceTrustExpired = knownDevice.length > 0 &&
    Date.now() - knownDevice[0].lastSeenAt.getTime() > KNOWN_DEVICE_TRUST_MS;

  if (knownDevice.length === 0 || deviceTrustExpired) {
    // New device — send verification code
    try {
      const { code, token } = await generateVerificationToken(user.id, user.email, "new_device");
      const activationLink = `${getBaseUrl(req)}/api/auth/activate?token=${token}`;
      await sendEmailVerificationEmail({ to: user.email, companyName: user.companyName, code, activationLink, type: "new_device" });
    } catch (e) {
      console.error("[Auth] Failed to send new device email:", e);
    }
    await logSecurityEvent({
      eventType: "LOGIN_NEW_DEVICE", req, userId: user.id,
      details: deviceTrustExpired
        ? `Appareil non revu depuis plus de 3 jours, revérification requise : ${email}`
        : `Nouvel appareil détecté : ${email}`,
      riskLevel: "medium",
    });
    resolveGeoInfo(ip).then(geo => {
      notifyLoginAttempt({ type: "new_device", email, role: user.role === "admin" ? "admin" : "merchant", ip, country: geo.country, isVpn: geo.isVpn, isHosting: geo.isHosting, org: geo.org, userId: user.id }).catch(() => {});
    }).catch(() => {});
    res.status(202).json({ requiresVerification: true, email: user.email, reason: "new_device" });
    return;
  }

  // Update last seen
  try {
    await db.update(knownDevicesTable).set({ lastSeenAt: new Date() })
      .where(and(eq(knownDevicesTable.userId, user.id), eq(knownDevicesTable.deviceHash, hash)));
  } catch { /* ignore */ }

  req.session.userId = user.id;
  req.session.role = user.role;

  await logSecurityEvent({ eventType: "LOGIN_SUCCESS", req, userId: user.id, details: `Connexion réussie : ${email}`, riskLevel: "low" });

  resolveGeoInfo(ip).then(geo => {
    notifyLoginAttempt({ type: "success", email, role: user.role === "admin" ? "admin" : "merchant", ip, country: geo.country, isVpn: geo.isVpn, isHosting: geo.isHosting, org: geo.org, userId: user.id }).catch(() => {});
  }).catch(() => {});

  res.json({ id: user.id, email: user.email, companyName: user.companyName, country: user.country, role: user.role, accountType: user.accountType, merchantCode: user.merchantCode });
});

// ─── VERIFY EMAIL (code or after activation link) ────────────────────────────

router.post("/auth/verify-email", codeVerifyRateLimiter, async (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    // Log which field is missing to help diagnose proxy/header stripping issues
    const missing = !email && !code ? "email+code" : !email ? "email" : "code";
    res.status(400).json({ error: `${missing === "email" ? "Email" : missing === "code" ? "Code" : "Email et code"} requis.` });
    return;
  }

  const now = new Date();
  let record: { id: number; userId: number; type: string } | undefined;
  try {
    const rows = await db
      .select({ id: emailVerificationTokensTable.id, userId: emailVerificationTokensTable.userId, type: emailVerificationTokensTable.type })
      .from(emailVerificationTokensTable)
      .where(
        and(
          eq(emailVerificationTokensTable.email, email.toLowerCase().trim()),
          eq(emailVerificationTokensTable.code, code.trim()),
          gt(emailVerificationTokensTable.expiresAt, now),
          isNull(emailVerificationTokensTable.usedAt),
        )
      )
      // DESC = most recently generated code first. When the user resends,
      // a new code is created and sent by email — the backend must match
      // against the NEWEST code or the user's fresh code will always miss.
      .orderBy(desc(emailVerificationTokensTable.createdAt))
      .limit(1);
    record = rows[0];
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
    return;
  }

  if (!record) {
    res.status(400).json({ error: "Code invalide ou expiré." });
    return;
  }

  await db.update(emailVerificationTokensTable).set({ usedAt: now }).where(eq(emailVerificationTokensTable.id, record.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, record.userId)).limit(1);
  if (!user) {
    res.status(400).json({ error: "Compte introuvable." });
    return;
  }

  // Mark email as verified if signup type
  if (record.type === "signup" && !user.emailVerified) {
    await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
  }

  // Register device as known
  try {
    const hash = deviceFingerprint(req, user.id);
    await db.insert(knownDevicesTable).values({ userId: user.id, deviceHash: hash }).onConflictDoNothing();
  } catch { /* ignore if table not ready */ }

  // Send welcome email on first signup verification
  if (record.type === "signup") {
    sendWelcomeEmail({ to: user.email, companyName: user.companyName }).catch(() => {});
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  await logSecurityEvent({ eventType: "LOGIN_SUCCESS", req, userId: user.id, details: `Email vérifié : ${email}`, riskLevel: "low" });

  res.json({ id: user.id, email: user.email, companyName: user.companyName, country: user.country, role: user.role, accountType: user.accountType, merchantCode: user.merchantCode });
});

// ─── ACTIVATE VIA LINK ────────────────────────────────────────────────────────

router.get("/auth/activate", async (req, res) => {
  const { token } = req.query as { token?: string };
  if (!token) {
    res.redirect("/login?error=token_missing");
    return;
  }

  const now = new Date();
  let record: { id: number; userId: number; type: string } | undefined;
  try {
    const rows = await db
      .select({ id: emailVerificationTokensTable.id, userId: emailVerificationTokensTable.userId, type: emailVerificationTokensTable.type })
      .from(emailVerificationTokensTable)
      .where(
        and(
          eq(emailVerificationTokensTable.token, token),
          gt(emailVerificationTokensTable.expiresAt, now),
          isNull(emailVerificationTokensTable.usedAt),
        )
      )
      .limit(1);
    record = rows[0];
  } catch {
    res.redirect("/login?error=server_error");
    return;
  }

  if (!record) {
    res.redirect("/login?error=token_invalid");
    return;
  }

  await db.update(emailVerificationTokensTable).set({ usedAt: now }).where(eq(emailVerificationTokensTable.id, record.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, record.userId)).limit(1);
  if (!user) {
    res.redirect("/login?error=user_not_found");
    return;
  }

  if (record.type === "signup" && !user.emailVerified) {
    await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
    sendWelcomeEmail({ to: user.email, companyName: user.companyName }).catch(() => {});
  }

  try {
    const hash = deviceFingerprint(req, user.id);
    await db.insert(knownDevicesTable).values({ userId: user.id, deviceHash: hash }).onConflictDoNothing();
  } catch { /* ignore */ }

  req.session.userId = user.id;
  req.session.role = user.role;

  await logSecurityEvent({ eventType: "LOGIN_SUCCESS", req, userId: user.id, details: `Activation lien email : ${user.email}`, riskLevel: "low" });

  res.redirect(user.role === "admin" ? "/admin" : "/dashboard");
});

// ─── RESEND CODE ──────────────────────────────────────────────────────────────

router.post("/auth/resend-verification", emailSendRateLimiter, async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email requis." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
  if (!user) {
    res.json({ ok: true });
    return;
  }

  try {
    const { code, token } = await generateVerificationToken(user.id, user.email, user.emailVerified ? "new_device" : "signup");
    const activationLink = `${getBaseUrl(req)}/api/auth/activate?token=${token}`;
    await sendEmailVerificationEmail({ to: user.email, companyName: user.companyName, code, activationLink, type: user.emailVerified ? "new_device" : "signup" });
  } catch (e) {
    console.error("[Auth] Failed to resend verification:", e);
  }

  res.json({ ok: true });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

router.post("/auth/logout", async (req, res) => {
  if (req.session.userId) {
    await logSecurityEvent({ eventType: "LOGOUT", req, userId: req.session.userId, riskLevel: "low" });
  }
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

router.post("/auth/forgot-password", emailSendRateLimiter, async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Adresse email invalide." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
  if (!user) {
    res.json({ ok: true, message: "Si ce compte existe, un email a été envoyé." });
    return;
  }

  const code = String(Math.floor(10000 + Math.random() * 90000));
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({ userId: user.id, email: user.email, code, token, expiresAt });

  const baseUrl = getBaseUrl(req);
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const { sendPasswordResetEmail } = await import("../lib/mailer");
  const mailResult = await sendPasswordResetEmail({ to: user.email, companyName: user.companyName, code, resetLink });

  if (!mailResult.ok) {
    console.warn("[Auth] Email reset non envoyé:", mailResult.error);
  }

  res.json({ ok: true, message: "Si ce compte existe, un email a été envoyé." });
});

router.post("/auth/verify-reset-code", codeVerifyRateLimiter, async (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    const missing = !email && !code ? "email+code" : !email ? "email" : "code";
    res.status(400).json({ error: `${missing === "email" ? "Email" : missing === "code" ? "Code" : "Email et code"} requis.` });
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
    // DESC = most recently generated code first (same fix as verify-email)
    .orderBy(desc(passwordResetTokensTable.createdAt))
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

// ─── FORGOT PASSWORD — CONTACT SUPPORT DIRECT ────────────────────────────────

router.post("/auth/forgot-password-support", emailSendRateLimiter, async (req, res) => {
  const { email, message } = req.body as { email?: string; message?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Adresse email invalide." });
    return;
  }

  if (!message || message.trim().length < 10) {
    res.status(400).json({ error: "Veuillez décrire votre problème (10 caractères minimum)." });
    return;
  }

  const result = await sendPasswordResetSupportEmail({
    userEmail: email.toLowerCase().trim(),
    message: message.trim(),
  });

  if (!result.ok) {
    console.warn("[Auth] Demande support reset non envoyée:", result.error);
  }

  res.json({ ok: true, message: "Votre demande a été transmise au support." });
});

// ─── ME ───────────────────────────────────────────────────────────────────────

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

  res.json({ id: user.id, email: user.email, companyName: user.companyName, country: user.country, role: user.role, accountType: user.accountType, merchantCode: user.merchantCode, mode: req.session.mode, isSupportAgent: user.isSupportAgent ?? false });
});

export default router;
