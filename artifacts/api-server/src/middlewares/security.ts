import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { securityEventsTable, blockedIpsTable, usersTable } from "@workspace/db/schema";
import { eq, and, gt, or } from "drizzle-orm";
import { notifyAdminIntrusion } from "../lib/telegram";

// ── Geo-IP cache (in-memory, 24h TTL) ────────────────────────────────────────
export interface GeoInfo {
  country: string | null;
  isVpn: boolean;
  isHosting: boolean;
  org: string;
}

interface GeoCacheEntry extends GeoInfo { cachedAt: number }
const geoCache = new Map<string, GeoCacheEntry>();
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Countries allowed to access the admin panel (comma-separated env var)
// Default: Togo only
const ADMIN_ALLOWED_COUNTRIES = (process.env["ADMIN_ALLOWED_COUNTRIES"] ?? "TG")
  .split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);

// IPs that always bypass geo check (comma-separated env var)
const getAdminAllowedIps = () =>
  (process.env["ADMIN_ALLOWED_IPS"] ?? "")
    .split(",").map((ip) => ip.trim()).filter(Boolean);

// IPs/CIDR prefixes considered "local" — always trusted
function isLocalIp(ip: string): boolean {
  return (
    ip === "::1" ||
    ip === "unknown" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("::ffff:127.") ||
    ip.startsWith("::ffff:10.")
  );
}

export async function resolveGeoInfo(ip: string): Promise<GeoInfo> {
  if (isLocalIp(ip)) return { country: "TG", isVpn: false, isHosting: false, org: "Local" };
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.cachedAt < GEO_CACHE_TTL_MS) {
    return { country: cached.country, isVpn: cached.isVpn, isHosting: cached.isHosting, org: cached.org };
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4_000);
    const resp = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,proxy,hosting,org`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!resp.ok) return { country: null, isVpn: false, isHosting: false, org: "" };
    const data = (await resp.json()) as { status?: string; countryCode?: string; proxy?: boolean; hosting?: boolean; org?: string };
    if (data.status !== "success" || !data.countryCode) return { country: null, isVpn: false, isHosting: false, org: "" };
    const entry: GeoCacheEntry = {
      country: data.countryCode,
      isVpn: data.proxy ?? false,
      isHosting: data.hosting ?? false,
      org: data.org ?? "",
      cachedAt: Date.now(),
    };
    geoCache.set(ip, entry);
    return { country: entry.country, isVpn: entry.isVpn, isHosting: entry.isHosting, org: entry.org };
  } catch {
    return { country: null, isVpn: false, isHosting: false, org: "" };
  }
}

// ── Bot / scanner UA patterns to block on admin routes ────────────────────────
const BOT_UA_PATTERNS = [
  "supabase",
  "supabase-js",
  "deno/",
  "python-requests",
  "python-urllib",
  "go-http-client",
  "curl/",
  "wget/",
  "scrapy",
  "masscan",
  "zgrab",
  "nuclei",
  "nmap",
  "nikto",
  "sqlmap",
  "dirbuster",
  "gobuster",
  "hydra",
  "openssl s_client",
];

// ── Admin geo-restriction + VPN/hosting blocker (fail-closed) ────────────────
export async function adminGeoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = getClientIp(req);
  const ua = (req.headers["user-agent"] ?? "").toLowerCase();

  // 1. Block scanner/bot user-agents immediately
  if (BOT_UA_PATTERNS.some((p) => ua.includes(p))) {
    db.insert(securityEventsTable).values({
      eventType: "SUSPICIOUS_ACTIVITY",
      userId: null,
      ipAddress: ip,
      userAgent: req.headers["user-agent"]?.substring(0, 500) ?? null,
      details: `Admin bot bloqué — UA: ${ua.substring(0, 120)}`,
      riskLevel: "critical",
    }).catch(() => {});
    res.status(403).json({ error: "Accès refusé." });
    return;
  }

  // 2. Local IPs always trusted (dev, Plesk loopback)
  if (isLocalIp(ip)) return next();

  // 3. Explicit IP whitelist (ADMIN_ALLOWED_IPS env var)
  if (getAdminAllowedIps().includes(ip)) return next();

  // 4. Geo + VPN/hosting lookup
  const { country, isVpn, isHosting, org } = await resolveGeoInfo(ip);

  const isWrongCountry = country !== null && !ADMIN_ALLOWED_COUNTRIES.includes(country);
  const isGeoFailed   = country === null; // fail-closed: block if geo unavailable
  const isSuspicious  = isVpn || isHosting;

  // Allow only if country confirmed in whitelist AND no VPN/hosting
  if (!isWrongCountry && !isGeoFailed && !isSuspicious) return next();

  // ── Build reason ──────────────────────────────────────────────────────────
  let reason: string;
  if (isVpn)               reason = `VPN/Proxy détecté — org: ${org}`;
  else if (isHosting)      reason = `Hébergement suspect — org: ${org}`;
  else if (isWrongCountry) reason = `Accès hors zone autorisée — pays: ${country}`;
  else                     reason = "Géolocalisation impossible — accès refusé par précaution";

  // ── Log security event (critical) ─────────────────────────────────────────
  db.insert(securityEventsTable).values({
    eventType: "IP_BLOCKED",
    userId: null,
    ipAddress: ip,
    userAgent: req.headers["user-agent"]?.substring(0, 500) ?? null,
    details: `Admin intrusion auto-bloquée — ${reason}`,
    riskLevel: "critical",
  }).catch(() => {});

  // ── Auto-block in DB (permanent) — onConflictDoNothing avoids duplicates ──
  db.insert(blockedIpsTable).values({
    ip,
    reason: `Auto-bloqué (accès panel admin) — ${reason}`,
    permanent: true,
  }).onConflictDoNothing().catch(() => {});

  // ── Telegram alert with "Débloquer" button (fire-and-forget) ─────────────
  notifyAdminIntrusion({
    ip,
    country: country ?? "inconnu",
    isVpn,
    isHosting,
    org,
    method: req.method,
    path: req.path,
    ua: req.headers["user-agent"] ?? "",
    reason,
  }).catch(() => {});

  res.status(403).json({
    error: "Accès refusé. Le panel admin n'est pas accessible depuis votre réseau.",
  });
}

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
      // upgradeInsecureRequests removed — causes HTTP→HTTPS loop inside Passenger
    },
  },
  // HSTS handled by Nginx/Plesk — avoid conflicts
  hsts: false,
  frameguard: { action: "deny" },
  xContentTypeOptions: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false,
  // Explicitly hide Express fingerprint
  hidePoweredBy: true,
});

// ── Honeypot: block scanner probe paths ───────────────────────────────────────
// These paths do not exist in DrimPay. Any request to them is a scanner/bot.
// Log it as suspicious and return a generic 404 (never 403 which confirms existence).
const SCANNER_PATHS = [
  "/graphql", "/.well-known/apollo", "/v1/graphql", "/hasura",
  "/actuator", "/actuator/env", "/actuator/health", "/actuator/dump",
  "/actuator/metrics", "/actuator/shutdown", "/actuator/beans",
  "/.env", "/.env.local", "/.env.production", "/.env.backup",
  "/.git", "/.git/config", "/.git/HEAD",
  "/wp-admin", "/wp-login.php", "/wp-config.php", "/wordpress",
  "/phpmyadmin", "/pma", "/mysql", "/adminer",
  "/config.php", "/configuration.php", "/config.json", "/config.yml",
  "/backup", "/backup.sql", "/dump.sql", "/database.sql",
  "/server-status", "/server-info", "/.htaccess", "/.htpasswd",
  "/cgi-bin", "/shell", "/cmd", "/exec",
  "/openid-configuration", "/.well-known/openid-configuration",
  "/oauth/token", "/oauth2/token",
  "/console", "/h2-console", "/spring", "/swagger-ui.html", "/v2/api-docs",
];

export async function honeypotMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const reqPath = req.path.toLowerCase();
  const isScanner = SCANNER_PATHS.some(
    (p) => reqPath === p || reqPath.startsWith(p + "/")
  );
  if (!isScanner) return next();

  const ip = getClientIp(req);
  try {
    await db.insert(securityEventsTable).values({
      eventType: "SUSPICIOUS_ACTIVITY",
      userId: null,
      ipAddress: ip,
      userAgent: req.headers["user-agent"]?.substring(0, 500) ?? null,
      details: `Scanner honeypot — ${req.method} ${req.path}`,
      riskLevel: "high",
    });
  } catch { /* never block on logging failure */ }

  // Return a blank 404 — do not confirm the path exists or reveal the stack
  res.status(404).end();
}

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
  | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGIN_NEW_DEVICE" | "LOGOUT" | "REGISTER"
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

export const adminRateLimiter = makeRateLimiter(
  60_000, 60,
  "Trop de requêtes vers le panel admin. Réessayez dans 1 minute."
);

// Envoi d'emails (resend verification, forgot password) : protège contre le
// clic répété sur "Envoyer" / "Renvoyer". Ne doit PAS être partagé avec les
// routes de vérification de code ci-dessous : sinon quelques clics sur
// "Renvoyer le code" épuisent le quota et la tentative de saisie du code
// échoue avec un message de rate-limit trompeur ("trop de tentatives") au
// lieu du vrai résultat (code correct/incorrect).
export const emailSendRateLimiter = makeRateLimiter(
  60_000, 3,
  "Trop de tentatives. Réessayez dans 1 minute."
);

// Vérification d'un code (email/reset) : plus permissif que l'envoi, car
// l'utilisateur peut légitimement se tromper de chiffre plusieurs fois de
// suite avant de réussir.
export const codeVerifyRateLimiter = makeRateLimiter(
  60_000, 10,
  "Trop de tentatives. Réessayez dans 1 minute."
);

// ── Blocage retrait (payout/reversement) par compte après échecs répétés ──────

export const WITHDRAWAL_LOCK_THRESHOLD = 4;
export const WITHDRAWAL_LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export async function getWithdrawalLockStatus(userId: number): Promise<{ locked: boolean; lockedUntil?: Date; retryAfterSeconds?: number }> {
  const [user] = await db
    .select({ withdrawalLockedUntil: usersTable.withdrawalLockedUntil })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (user?.withdrawalLockedUntil && new Date(user.withdrawalLockedUntil) > new Date()) {
    const lockedUntil = new Date(user.withdrawalLockedUntil);
    return { locked: true, lockedUntil, retryAfterSeconds: Math.ceil((lockedUntil.getTime() - Date.now()) / 1000) };
  }
  return { locked: false };
}

export async function recordWithdrawalFailure(userId: number, req: Request): Promise<{ locked: boolean; lockedUntil?: Date; attemptsRemaining?: number }> {
  const [user] = await db
    .select({ withdrawalFailedAttempts: usersTable.withdrawalFailedAttempts })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  const nextCount = (user?.withdrawalFailedAttempts ?? 0) + 1;

  if (nextCount >= WITHDRAWAL_LOCK_THRESHOLD) {
    const lockedUntil = new Date(Date.now() + WITHDRAWAL_LOCK_DURATION_MS);
    await db.update(usersTable)
      .set({ withdrawalFailedAttempts: 0, withdrawalLockedUntil: lockedUntil })
      .where(eq(usersTable.id, userId));
    logSecurityEvent({
      eventType: "SUSPICIOUS_ACTIVITY", req, userId,
      details: `Compte bloqué pour les retraits 30 minutes après ${WITHDRAWAL_LOCK_THRESHOLD} échecs consécutifs.`,
      riskLevel: "high",
    }).catch(() => {});
    return { locked: true, lockedUntil };
  }

  await db.update(usersTable)
    .set({ withdrawalFailedAttempts: nextCount })
    .where(eq(usersTable.id, userId));
  return { locked: false, attemptsRemaining: WITHDRAWAL_LOCK_THRESHOLD - nextCount };
}

export async function clearWithdrawalFailures(userId: number) {
  await db.update(usersTable)
    .set({ withdrawalFailedAttempts: 0, withdrawalLockedUntil: null })
    .where(eq(usersTable.id, userId));
}
