import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  helmetMiddleware,
  globalRateLimiter,
  ipBlockMiddleware,
} from "./middlewares/security";
import { subdomainMiddleware } from "./middlewares/subdomain";

const app: Express = express();

const isProd = process.env["NODE_ENV"] === "production";

// Trust reverse proxy — Plesk runs Nginx → Passenger → Node.js (2 layers).
// Setting true trusts all proxies, which is correct for a dedicated server.
if (isProd) {
  app.set("trust proxy", true);
}

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmetMiddleware);

// ── CORS ─────────────────────────────────────────────────────────────────────
// Include drimpay.com (no subdomain) explicitly — the regex \.drimpay\.com$
// only matches subdomains, not the apex domain itself.
const extraOrigin = process.env["ALLOWED_ORIGIN"];
const allowedOrigins = isProd
  ? [
      "https://drimpay.com",
      "https://www.drimpay.com",
      ...(extraOrigin ? [extraOrigin] : []),
      /\.drimpay\.com$/,
      /\.replit\.app$/,
      /\.replit\.dev$/,
    ]
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ── Session ──────────────────────────────────────────────────────────────────
const sessionSecret = process.env["SESSION_SECRET"];
// Do NOT throw synchronously — a missing secret at startup would crash the
// Passenger process before it can even accept a health-check probe.
if (!sessionSecret) {
  logger.error("SESSION_SECRET is not set — sessions will not work. Set this env var in Plesk.");
}

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15,
    }),
    // Fallback secret prevents a synchronous throw if env var is missing.
    // Sessions will be invalid but the process won't crash on Passenger.
    secret: sessionSecret || "drimpay-fallback-secret-please-set-SESSION_SECRET",
    resave: false,
    saveUninitialized: false,
    name: "dp_sid",
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Quick health probe (before rate-limiter so Passenger/LB always reaches it) ──
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    env: process.env["NODE_ENV"] ?? "unknown",
  });
});

// ── Security middleware (IP block + global rate limit) ─────────────────────────
app.use(ipBlockMiddleware);
app.use(globalRateLimiter);

// ── Subdomain routing (dashboard.drimpay.com → /dashboard, etc.) ─────────────
app.use(subdomainMiddleware);

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── 404 handler for unmatched /api/* routes (must come before SPA fallback) ───
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ── Serve React SPA in production ─────────────────────────────────────────────
if (isProd) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendDist = path.resolve(__dirname, "../../drimpay/dist/public");

  if (existsSync(frontendDist)) {
    // Serve static assets (JS, CSS, images) with aggressive caching
    app.use(
      express.static(frontendDist, {
        maxAge: "7d",
        etag: true,
        index: false, // Don't auto-serve index.html — let catch-all handle it
        setHeaders(res, filePath) {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        },
      })
    );

    // SPA catch-all — Express 5 compatible (no regex routes)
    // Any path that wasn't handled above gets index.html for client-side routing
    app.use((_req, res, next) => {
      res.sendFile(path.join(frontendDist, "index.html"), (err) => {
        if (err) next(); // Don't crash, let error handler deal with it
      });
    });

    logger.info({ frontendDist }, "Serving frontend static files");
  } else {
    logger.warn({ frontendDist }, "Frontend dist not found — skipping static serving");
  }
}

// ── Global Express error handler (MUST be last, after all routes) ─────────────
// 4-argument signature is required for Express to recognise this as an error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status: number = typeof err?.status === "number" ? err.status : 500;
  const message: string = err?.message ?? "Erreur interne du serveur";
  logger.error({ err, status }, "Unhandled route error");
  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
});

export default app;
