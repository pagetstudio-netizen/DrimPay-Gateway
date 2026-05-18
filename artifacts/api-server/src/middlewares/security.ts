import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { securityEventsTable, blockedIpsTable } from "@workspace/db/schema";
import { eq, and, gt, or, isNull } from "drizzle-orm";

// ── Helmet security headers ───────────────────────────────────────────────────

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      // upgradeInsecureRequests removed — it causes internal HTTP→HTTPS redirect
      // loops when Passenger communicates with the Node.js process over HTTP.
    },
  },
  // HSTS is set by Nginx/Plesk already; let Nginx handle it to avoid conflicts.
  hsts: false,
  frameguard: { action: "deny" },
  xContentTypeOptions: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false,
});

// ── IP helper ─────────────────────────────────────────────────────────────────

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";
  }
  return req.socket.remoteAddress ?? req.ip ?? "unknown";
}

// ── Security event logger ─────────────────────────────────────────────────────

type SecurityEventType =
  | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "REGISTER"
  | "BRUTE_FORCE" | "RATE_LIMITED" | "IP_BLOCKED" | "SUSPICIOUS_ACTIVITY"
  | "PASSWORD_CHANGED" | "PASSWORD_RESET" | "API_KEY_CREATED" | "API_KEY_REVOKED"
  | "WEBHOOK_INVALID" | "SESSION_EXPIRED";

export async function logSecurityEvent(opts: {
  eventType: SecurityEventType;
  req: Request;
  userId?: number;
  details?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
}) {
  try {
    await db.insert(securityEventsTable).values({
      eventType: opts.eventType,
      userId: opts.userId ?? null,
      ipAddress: getClientIp(opts.req),
      userAgent: opts.req.headers["user-agent"]?.substring(0, 500) ?? null,
      details: opts.details ?? null,
      riskLevel: opts.riskLevel ?? "low",
    });
  } catch {
    // Never throw — logging must not break requests
  }
}

// ── In-memory brute force tracker ─────────────────────────────────────────────

const failedLogins = new Map<string, { count: number; firstAt: number }>();
const BRUTE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BRUTE_MAX_ATTEMPTS = 10;

export function trackFailedLogin(ip: string): boolean {
  const now = Date.now();
  const entry = failedLogins.get(ip);
  if (!entry || now - entry.firstAt > BRUTE_WINDOW_MS) {
    failedLogins.set(ip, { count: 1, firstAt: now });
    return false;
  }
  entry.count++;
  if (entry.count >= BRUTE_MAX_ATTEMPTS) return true; // should block
  return false;
}

export function clearFailedLogins(ip: string) {
  failedLogins.delete(ip);
}

// ── IP blocking middleware ────────────────────────────────────────────────────

export async function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  try {
    const [blocked] = await db
      .select()
      .from(blockedIpsTable)
      .where(
        and(
          eq(blockedIpsTable.ip, ip),
          or(
            eq(blockedIpsTable.permanent, true),
            gt(blockedIpsTable.blockedUntil, new Date())
          )
        )
      )
      .limit(1);

    if (blocked) {
      res.status(403).json({ error: "Accès refusé. Votre adresse IP est bloquée." });
      return;
    }
  } catch {
    // On DB error, fail open (don't block all traffic)
  }
  next();
}

// ── Rate limiters ─────────────────────────────────────────────────────────────

const makeRateLimiter = (
  windowMs: number,
  max: number,
  message: string
) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    keyGenerator: (req) => getClientIp(req),
    skip: (req) => req.headers["x-internal-skip-rate-limit"] === process.env.SESSION_SECRET,
  });

export const loginRateLimiter = makeRateLimiter(
  60_000, 5,
  "Trop de tentatives de connexion. Réessayez dans 1 minute."
);

export const signupRateLimiter = makeRateLimiter(
  60_000, 3,
  "Trop de créations de compte. Réessayez dans 1 minute."
);

export const payoutRateLimiter = makeRateLimiter(
  60_000, 10,
  "Limite de pay-out atteinte. Réessayez dans 1 minute."
);

export const apiKeyRateLimiter = makeRateLimiter(
  60_000, 3,
  "Trop de requêtes sur les clés API. Réessayez dans 1 minute."
);

export const webhookRateLimiter = makeRateLimiter(
  60_000, 30,
  "Limite webhook atteinte. Réessayez dans 1 minute."
);

export const globalRateLimiter = makeRateLimiter(
  60_000, 300,
  "Trop de requêtes. Réessayez dans 1 minute."
);
