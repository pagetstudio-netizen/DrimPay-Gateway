// ── Crash guards — registered FIRST before any imports take effect ────────────
// In ESM, this module body runs after all static imports are resolved,
// but we still register these as early as possible to catch runtime crashes.
// For import-time crashes, we rely on the file-based logger below.

import { appendFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname2 = dirname(fileURLToPath(import.meta.url));
const logDir = join(__dirname2, "..", "..", "..", "logs");

function crashLog(label: string, err: unknown) {
  try {
    mkdirSync(logDir, { recursive: true });
    const msg = `[${new Date().toISOString()}] ${label}: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`;
    appendFileSync(join(logDir, "startup-errors.log"), msg);
    process.stderr.write(msg);
  } catch {
    // If even file logging fails, at least stderr
    process.stderr.write(`${label}: ${String(err)}\n`);
  }
}

process.on("uncaughtException", (err) => {
  crashLog("[uncaughtException]", err);
  // Do NOT exit — Passenger shows "We're sorry" if the process dies
});

process.on("unhandledRejection", (reason) => {
  crashLog("[unhandledRejection]", reason);
});

import app from "./app";
import { logger } from "./lib/logger";
import { notifyStartup, startDailyReport, startPolling } from "./lib/telegram";
import { ensureKybBucket, ensureContractTemplate } from "./lib/storage";
import { logClapayConfig } from "./lib/clapay";
import { pool } from "@workspace/db";

// ── Start ─────────────────────────────────────────────────────────────────────

// Use || (not ??) so that empty-string PORT (e.g. set to "" in Plesk) falls
// back to 8080 instead of being parsed as NaN/0 and crashing the process.
const rawPort = process.env["PORT"] || "8080";
const port = Number(rawPort);

const effectivePort = (Number.isNaN(port) || port <= 0) ? 8080 : port;
if (effectivePort !== port) {
  crashLog("[PORT]", `Invalid PORT="${rawPort}" — falling back to 8080. Fix: remove PORT from Plesk custom env vars and let Passenger manage it.`);
}

logger.info({ port: effectivePort, env: process.env["NODE_ENV"] ?? "unknown" }, "Starting DrimPay API server");

// ── Startup env-var diagnostics (visible in Plesk / any host logs) ────────────
const envDiag = {
  SESSION_SECRET:            process.env["SESSION_SECRET"]            ? `✓ (${process.env["SESSION_SECRET"]!.length} chars)` : "✗ MANQUANT",
  SUPABASE_DATABASE_URL:     process.env["SUPABASE_DATABASE_URL"]     ? "✓ défini" : (process.env["DATABASE_URL"] ? "✓ (DATABASE_URL fallback)" : "✗ MANQUANT"),
  SUPABASE_URL:              process.env["SUPABASE_URL"]              ? "✓ défini" : "✗ MANQUANT",
  SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"] ? `✓ (${process.env["SUPABASE_SERVICE_ROLE_KEY"]!.length} chars) — KYB uploads actifs` : "✗ MANQUANT — KYB uploads DÉSACTIVÉS",
  SUPABASE_ANON_KEY:         process.env["SUPABASE_ANON_KEY"]         ? "✓ défini" : "✗ MANQUANT",
  RESEND_API_KEY:            process.env["RESEND_API_KEY"]            ? "✓ défini" : "✗ MANQUANT — emails désactivés",
};
for (const [key, val] of Object.entries(envDiag)) {
  const level = val.startsWith("✗") ? "warn" : "info";
  logger[level]({ key, status: val }, `[ENV] ${key}: ${val}`);
}

// Bind explicitly to 0.0.0.0 so Passenger/Nginx can reach the socket on all interfaces
const server = app.listen(effectivePort, "0.0.0.0", () => {
  logger.info({ port: effectivePort }, "Server listening");
  logClapayConfig();

  // Supabase Storage — ensure KYB bucket exists and upload contract template
  ensureKybBucket()
    .then(() => ensureContractTemplate())
    .catch((err) => {
      logger.warn({ err }, "Storage init skipped");
    });

  // Telegram bot: startup notification + command polling + daily report
  setTimeout(() => {
    notifyStartup().catch(() => {});
    startPolling();
    startDailyReport();
  }, 3_000);
});

let eaddrinuseRetries = 0;
// On Replit the port conflict is permanent (competing processes) — exit fast so
// the workflow manager can kill the blocker and restart.
// On Plesk/Passenger it's a transient restart race — retry for up to 90 s.
const isReplit = !!process.env["REPL_ID"];
const MAX_EADDRINUSE_RETRIES = isReplit ? 3 : 30; // 3×3s=9s on Replit, 30×3s=90s on Plesk

server.on("error", (err: any) => {
  logger.error({ err }, "HTTP server error");
  if (err.code === "EADDRINUSE") {
    eaddrinuseRetries += 1;
    if (eaddrinuseRetries > MAX_EADDRINUSE_RETRIES) {
      crashLog("[EADDRINUSE]", `Port ${effectivePort} still busy after ${eaddrinuseRetries} retries — exiting`);
      logger.error({ port: effectivePort, retries: eaddrinuseRetries }, "Port still busy after max retries — exiting");
      process.exit(1);
    }
    logger.warn({ port: effectivePort, retry: eaddrinuseRetries, max: MAX_EADDRINUSE_RETRIES }, "Port busy — retrying in 3 s");
    setTimeout(() => {
      server.close();
      server.listen(effectivePort, "0.0.0.0", () => {
        eaddrinuseRetries = 0;
        logger.info({ port: effectivePort }, "Server listening (after retry)");
      });
    }, 3_000);
  }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// Passenger / systemd send SIGTERM to stop the app.
// We close the HTTP server first (stops accepting new connections),
// drain existing requests, then close the DB pool.

let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Graceful shutdown initiated");

  // Hard kill after 10 s in case connections don't drain
  const forceExit = setTimeout(() => {
    logger.error("Forced exit after 10 s — some connections may not have closed");
    process.exit(1);
  }, 10_000);
  forceExit.unref(); // Don't keep the event loop alive just for this timer

  server.close(() => {
    logger.info("HTTP server closed");
    pool.end().then(() => {
      logger.info("DB pool closed — exiting cleanly");
      process.exit(0);
    }).catch((err) => {
      logger.error({ err }, "DB pool close error");
      process.exit(1);
    });
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
