---
name: Supabase DB empty after reset
description: DrimPay's Supabase Postgres can end up with zero tables (fresh/reset project) even though SUPABASE_DATABASE_URL is valid -- distinguish from schema drift.
---

- If information_schema.tables for schema public returns zero rows entirely (not just a missing column), the Supabase project's database was reset/recreated, not just drifted. Fix by running `pnpm run push` in lib/db (drizzle-kit push against SUPABASE_DATABASE_URL) to recreate all tables from lib/db/src/schema.
- **Why:** this is a different failure mode than the known schema-drift issue (missing single columns) -- a totally empty public schema means the whole DB was wiped/recreated, and every DB-backed route shows a generic loading/500 error, not just one detail panel.
- **How to apply:** when debugging a new "erreur de chargement" after the user mentions reconnecting/checking a secret, first check table count in public before hunting for a specific missing column -- connect via direct pg (no SSL -- this Supabase instance rejects SSL connections) using SUPABASE_DATABASE_URL, not the Replit executeSql tool (targets Replit's own DB, not this external Supabase one).
