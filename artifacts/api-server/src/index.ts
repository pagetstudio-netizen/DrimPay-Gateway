import app from "./app";
import { logger } from "./lib/logger";
import { notifyStartup, startDailyReport, startPolling } from "./lib/telegram";
import { ensureKybBucket } from "./lib/storage";

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

  // Supabase Storage — ensure KYB bucket exists
  ensureKybBucket().catch(() => {});

  // Telegram bot: startup notification + command polling + daily report
  setTimeout(() => {
    notifyStartup().catch(() => {});
    startPolling();
    startDailyReport();
  }, 3_000);
});
