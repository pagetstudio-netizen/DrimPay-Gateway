import app from "./app";
import { logger } from "./lib/logger";
import { notifyStartup, startDailyReport, startPolling } from "./lib/telegram";
import { ensureKybBucket, ensureContractTemplate } from "./lib/storage";
import { logClapayConfig } from "./lib/clapay";

// ── Global crash guards ───────────────────────────────────────────────────────
// Prevent Phusion Passenger from seeing a crashed process on transient errors
// (e.g. DB idle-connection drops, Telegram fetch failures, etc.)

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
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  logClapayConfig();

  // Supabase Storage — ensure KYB bucket exists and upload contract template
  ensureKybBucket()
    .then(() => ensureContractTemplate())
    .catch(() => {});

  // Telegram bot: startup notification + command polling + daily report
  setTimeout(() => {
    notifyStartup().catch(() => {});
    startPolling();
    startDailyReport();
  }, 3_000);
});
