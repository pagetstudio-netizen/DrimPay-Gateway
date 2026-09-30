-- Keep a merchant's Live/Sandbox dashboard choice across logout and new sessions.
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "dashboard_mode" text NOT NULL DEFAULT 'sandbox';