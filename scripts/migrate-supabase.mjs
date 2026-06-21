import pg from "pg";

const { Pool } = pg;

const url = process.env.SUPABASE_DATABASE_URL;
if (!url) { console.error("SUPABASE_DATABASE_URL manquant"); process.exit(1); }

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });

const sql = async (query) => {
  const client = await pool.connect();
  try { return await client.query(query); }
  finally { client.release(); }
};

console.log("Connexion à Supabase...");

try {
  // ENUMs
  await sql(`DO $$ BEGIN CREATE TYPE account_type AS ENUM ('enterprise','personal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await sql(`DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin','user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await sql(`DO $$ BEGIN CREATE TYPE api_key_status AS ENUM ('active','revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await sql(`DO $$ BEGIN CREATE TYPE api_key_env AS ENUM ('sandbox','live'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await sql(`DO $$ BEGIN CREATE TYPE kyb_status AS ENUM ('pending','submitted','under_review','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await sql(`DO $$ BEGIN CREATE TYPE transaction_type AS ENUM ('payin','payout'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await sql(`DO $$ BEGIN CREATE TYPE transaction_status AS ENUM ('queued','pending','processing','success','failed','reversed','cancelled','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  console.log("ENUMs OK");

  // Colonnes manquantes dans users
  const cols = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type account_type NOT NULL DEFAULT 'enterprise'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS merchant_code text`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS webhook_url text`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS static_ip text`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS payin_fee_percent numeric(5,2)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_fee_percent numeric(5,2)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'OTHER'`,
  ];
  for (const col of cols) {
    await sql(col);
    console.log("OK:", col.split("ADD COLUMN IF NOT EXISTS")[1]?.split(" ")[1] ?? col.slice(0, 60));
  }

  // Vérification finale
  const res = await sql(`SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`);
  console.log("\nColonnes users:", res.rows.map(r => r.column_name).join(", "));
  console.log("\nMigration terminée ✓");
} catch (e) {
  console.error("Erreur:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
