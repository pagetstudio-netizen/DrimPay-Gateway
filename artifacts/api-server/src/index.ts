import app from "./app";
import { logger } from "./lib/logger";
import { notifyStartup, startDailyReport, startPolling } from "./lib/telegram";
import { ensureKybBucket, ensureContractTemplate } from "./lib/storage";
import { logClapayConfig } from "./lib/clapay";
import { pool } from "@workspace/db";

// ── Global crash guards ───────────────────────────────────────────────────────
// Prevent Phusion Passenger from seeing a crashed process on transient errors.
// These MUST be registered before any async code runs.

process.on("uncaughtException", (err) => {
  logger.error({ err }, "[Process] uncaughtException — le processus continue");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "[Process] unhandledRejection — le processus continue");
});

// ── Start ─────────────────────────────────────────────────────────────────────

const rawPort = process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.error({ rawPort }, "Invalid PORT value — cannot start");
  process.exit(1);
}

logger.info({ port, env: process.env["NODE_ENV"] ?? "unknown" }, "Starting DrimPay API server");

const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");
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

server.on("error", (err: any) => {
  logger.error({ err }, "HTTP server error");
  if (err.code === "EADDRINUSE") {
    logger.error({ port }, "Port already in use — exiting");
    process.exit(1);
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
