import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * GET /api/diag
 * Endpoint de diagnostic — réservé aux admins connectés.
 * Affiche uniquement l'existence (✓/✗) des variables d'environnement critiques,
 * jamais leurs valeurs.
 */
router.get("/diag", (req: any, res) => {
  if (!req.session?.userId || req.session?.role !== "admin") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const check = (key: string, extra?: string) => {
    const val = process.env[key];
    if (!val) return `✗ MANQUANT${extra ? ` — ${extra}` : ""}`;
    return `✓ défini (${val.length} chars)`;
  };

  const dbUrl = process.env["SUPABASE_DATABASE_URL"] || process.env["DATABASE_URL"];

  const env = {
    SESSION_SECRET:            check("SESSION_SECRET", "sessions invalides"),
    SUPABASE_DATABASE_URL:     dbUrl ? `✓ défini (${dbUrl.length} chars)` : "✗ MANQUANT — base de données inaccessible",
    SUPABASE_URL:              check("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: check("SUPABASE_SERVICE_ROLE_KEY", "KYB uploads DÉSACTIVÉS"),
    SUPABASE_ANON_KEY:         check("SUPABASE_ANON_KEY"),
    RESEND_API_KEY:            check("RESEND_API_KEY", "emails désactivés"),
    PAYDUNYA_MASTER_KEY:       check("PAYDUNYA_MASTER_KEY", "PayDunya désactivé"),
    PAYDUNYA_PRIVATE_KEY:      check("PAYDUNYA_PRIVATE_KEY"),
    PAYDUNYA_TOKEN:            check("PAYDUNYA_TOKEN"),
    CLAPAY_API_TOKEN:          check("CLAPAY_API_TOKEN", "ClaPay désactivé"),
    NODE_ENV:                  process.env["NODE_ENV"] ?? "(non défini)",
    PORT:                      process.env["PORT"] ?? "(non défini)",
  };

  const missing = Object.entries(env).filter(([, v]) => v.startsWith("✗")).map(([k]) => k);
  const ok = missing.length === 0;

  res.status(ok ? 200 : 206).json({
    status: ok ? "ok" : "partiel",
    missingCount: missing.length,
    missing,
    env,
    pid: process.pid,
    uptime: `${Math.floor(process.uptime())}s`,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
});

export default router;
