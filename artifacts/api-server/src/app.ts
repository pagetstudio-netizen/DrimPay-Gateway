import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const isProd = process.env["NODE_ENV"] === "production";

// Trust reverse proxy (Plesk / nginx) so that req.ip and secure cookies work
if (isProd) {
  app.set("trust proxy", 1);
}

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) throw new Error("SESSION_SECRET is required");

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "lax" : false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

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
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ── Serve React SPA in production ─────────────────────────────────────────
if (isProd) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Built artifact is at: artifacts/api-server/dist/index.mjs
  // Frontend dist is at:  artifacts/drimpay/dist/public
  const frontendDist = path.resolve(__dirname, "../../drimpay/dist/public");

  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist, { maxAge: "7d", etag: true }));
    // SPA fallback — serve index.html for all non-API routes
    app.get(/^(?!\/api).*$/, (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
    logger.info({ frontendDist }, "Serving frontend static files");
  } else {
    logger.warn({ frontendDist }, "Frontend dist not found — skipping static serving");
  }
}

export default app;
