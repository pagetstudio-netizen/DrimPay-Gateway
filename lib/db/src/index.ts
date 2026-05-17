import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set. Please configure your database connection."
  );
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// CRITICAL: without this listener, idle-client errors from Supabase closing
// connections emit an 'error' event that Node.js treats as an uncaught exception,
// crashing the entire process (Phusion Passenger shows the error page).
pool.on("error", (err) => {
  console.error("[DB Pool] Idle client error — connexion perdue, ignorée:", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
