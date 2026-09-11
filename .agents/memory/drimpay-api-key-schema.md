---
name: DrimPay API key schema
description: The API key page depends on the nullable api_keys.webhook_secret column, which may be missing from older Plesk/Supabase databases.
---

- Keep the database schema and migration script aligned with the API key webhook-secret feature. Existing deployments can have the original `api_keys` table without `webhook_secret`.
- **Why:** the API key listing selects whether each webhook secret exists; a missing column makes the entire merchant page return a generic 503 even when the user's keys are otherwise valid.
- **How to apply:** before restarting an older Plesk deployment, run the Supabase migration that adds `webhook_secret text` with `IF NOT EXISTS`; never delete or recreate the `api_keys` table.