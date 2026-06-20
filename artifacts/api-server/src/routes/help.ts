import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const router: IRouter = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

router.get("/help", async (_req, res) => {
  const checks: Record<string, any> = {};

  // ── Node / process ───────────────────────────────────────────────────────
  checks.server = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptimeSeconds: Math.floor(process.uptime()),
    env: process.env["NODE_ENV"] ?? "(non défini)",
    port: process.env["PORT"] ?? "(non défini)",
    replId: process.env["REPL_ID"] ? "✓ replit" : "✗ (Plesk/autre)",
  };

  // ── Mémoire ──────────────────────────────────────────────────────────────
  const mem = process.memoryUsage();
  checks.memory = {
    heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(1),
    heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(1),
    rssMB: (mem.rss / 1024 / 1024).toFixed(1),
  };

  // ── Variables d'environnement (existence seulement, pas les valeurs) ─────
  const envChecks: Record<string, string> = {};
  const required = [
    "SESSION_SECRET",
    "SUPABASE_DATABASE_URL",
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "CLAPAY_API_TOKEN",
    "CLAPAY_BASE_URL",
    "CLAPAY_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "NODE_ENV",
    "PORT",
    "ACTIVE_AGGREGATOR",
  ];
  for (const key of required) {
    const val = process.env[key];
    envChecks[key] = val ? `✓ défini (${val.length} chars)` : "✗ MANQUANT";
  }
  checks.env = envChecks;

  // ── Base de données ──────────────────────────────────────────────────────
  const dbStart = Date.now();
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    client.release();
    checks.database = {
      status: "✓ connecté",
      latencyMs: Date.now() - dbStart,
      url: process.env["SUPABASE_DATABASE_URL"]
        ? `SUPABASE_DATABASE_URL (${(process.env["SUPABASE_DATABASE_URL"] ?? "").split("@")[1] ?? "?"} )`
        : process.env["DATABASE_URL"]
        ? `DATABASE_URL`
        : "✗ aucune URL",
      tables: result.rows.map((r: any) => r.table_name),
      tableCount: result.rows.length,
    };
  } catch (err: any) {
    checks.database = {
      status: "✗ ERREUR",
      latencyMs: Date.now() - dbStart,
      error: err?.message ?? String(err),
    };
  }

  // ── Fichiers clés sur disque ─────────────────────────────────────────────
  const root = join(__dirname, "..", "..", "..");
  const files: Record<string, string> = {
    "start.cjs": join(root, "start.cjs"),
    "api-server dist": join(root, "artifacts", "api-server", "dist", "index.mjs"),
    "frontend dist": join(root, "artifacts", "drimpay", "dist", "public", "index.html"),
    "pnpm-lock.yaml": join(root, "pnpm-lock.yaml"),
    "node_modules": join(root, "node_modules"),
  };
  checks.files = {};
  for (const [label, path] of Object.entries(files)) {
    checks.files[label] = existsSync(path) ? "✓ présent" : "✗ ABSENT";
  }

  // ── Clapay ───────────────────────────────────────────────────────────────
  checks.clapay = {
    baseUrl: process.env["CLAPAY_BASE_URL"] ?? "✗ non défini",
    token: process.env["CLAPAY_API_TOKEN"] ? "✓ défini" : "✗ MANQUANT",
    webhookSecret: process.env["CLAPAY_WEBHOOK_SECRET"] ? "✓ défini" : "✗ MANQUANT",
    aggregator: process.env["ACTIVE_AGGREGATOR"] ?? "(non défini)",
  };

  // ── Supabase Storage ─────────────────────────────────────────────────────
  checks.storage = {
    supabaseUrl: process.env["SUPABASE_URL"] ?? "✗ non défini",
    serviceRoleKey: process.env["SUPABASE_SERVICE_ROLE_KEY"] ? "✓ défini" : "✗ MANQUANT — KYB uploads désactivés",
  };

  // ── Email ────────────────────────────────────────────────────────────────
  checks.email = {
    resendKey: process.env["RESEND_API_KEY"] ? "✓ défini" : "✗ MANQUANT — emails désactivés",
  };

  // ── Session ──────────────────────────────────────────────────────────────
  checks.session = {
    secret: process.env["SESSION_SECRET"] ? "✓ défini" : "✗ MANQUANT — sessions invalides",
  };

  // ── Résultat global ──────────────────────────────────────────────────────
  const hasDbError = checks.database.status?.startsWith("✗");
  const missingCritical = !process.env["SESSION_SECRET"] || (!process.env["SUPABASE_DATABASE_URL"] && !process.env["DATABASE_URL"]);

  const overall = hasDbError || missingCritical ? "⚠️ PROBLÈMES DÉTECTÉS" : "✓ OK";

  res.json({
    overall,
    timestamp: new Date().toISOString(),
    ...checks,
  });
});

export default router;
