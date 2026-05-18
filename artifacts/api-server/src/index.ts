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

// Bind explicitly to 0.0.0.0 so Passenger/Nginx can reach the socket on all interfaces
const server = app.listen(port, "0.0.0.0", () => {
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

let eaddrinuseRetries = 0;
const MAX_EADDRINUSE_RETRIES = 5;

server.on("error", (err: any) => {
  logger.error({ err }, "HTTP server error");
  if (err.code === "EADDRINUSE") {
    eaddrinuseRetries += 1;
    if (eaddrinuseRetries > MAX_EADDRINUSE_RETRIES) {
      logger.error({ port, retries: eaddrinuseRetries }, "Port still busy after max retries — exiting so process manager can restart");
      process.exit(1);
    }
    // Wait 3 s for the previous process to release the port, then retry.
    logger.warn({ port, retry: eaddrinuseRetries, max: MAX_EADDRINUSE_RETRIES }, "Port busy — retrying in 3 s");
    setTimeout(() => {
      server.close();
      server.listen(port, "0.0.0.0", () => {
        eaddrinuseRetries = 0;
        logger.info({ port }, "Server listening (after retry)");
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
