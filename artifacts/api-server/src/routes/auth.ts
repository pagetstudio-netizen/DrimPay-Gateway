import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import { usersTable, apiKeysTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  country: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { email, password, companyName, country } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const merchantCode = crypto.randomBytes(3).toString("hex");
  const [user] = await db.insert(usersTable).values({ email, passwordHash, companyName, country, merchantCode }).returning();

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
    console.log(`[DrimPay] Sandbox API key auto-generated for new user: ${email}`);
  } catch (e) {
    console.error("[DrimPay] Failed to auto-generate sandbox key at signup:", e);
  }

  res.status(201).json({
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    country: user.country,
    role: user.role,
    merchantCode: user.merchantCode,
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    country: user.country,
    role: user.role,
    merchantCode: user.merchantCode,
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
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

  res.json({
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    country: user.country,
    role: user.role,
    merchantCode: user.merchantCode,
  });
});

export default router;
