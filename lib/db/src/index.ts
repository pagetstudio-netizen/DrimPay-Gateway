import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  console.error(
    "[DB] FATAL: DATABASE_URL is not set. " +
    "All database operations will fail until this is fixed."
  );
}

export const pool = new Pool({
  connectionString: connectionString ?? "postgresql://localhost/placeholder",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: connectionString?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

// CRITICAL: without this listener, idle-client errors from Supabase closing
// connections emit an 'error' event that Node.js treats as an uncaught exception,
// crashing the entire process (Phusion Passenger shows the error page).
pool.on("error", (err) => {
  console.error("[DB Pool] Idle client error — connexion perdue, ignorée:", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
