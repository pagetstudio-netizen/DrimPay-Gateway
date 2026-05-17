import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
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

// Trust reverse proxy (Plesk / nginx) so that req.ip and secure cookies work
if (isProd) {
  app.set("trust proxy", 1);
}

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmetMiddleware);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = isProd
  ? [
      process.env["ALLOWED_ORIGIN"] ?? "",
      /\.drimpay\.com$/,
      /\.replit\.app$/,
      /\.replit\.dev$/,
    ].filter(Boolean)
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
if (!sessionSecret) throw new Error("SESSION_SECRET is required");

app.use(
  session({
    secret: sessionSecret,
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

// ── Health probe (must be before rate-limiter so Passenger/LB can always reach it) ──
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

// ── Serve React SPA in production ─────────────────────────────────────────────
if (isProd) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendDist = path.resolve(__dirname, "../../drimpay/dist/public");

  if (existsSync(frontendDist)) {
    app.use(
      express.static(frontendDist, {
        maxAge: "7d",
        etag: true,
        setHeaders(res, filePath) {
          if (filePath.endsWith("index.html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        },
      })
    );
    // SPA catch-all — serve index.html for all non-API routes
    app.get(/^(?!\/api).*$/, (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
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
