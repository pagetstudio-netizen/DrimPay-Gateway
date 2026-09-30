---
name: DrimPay merchant webhook secrets
description: Stable HMAC credentials are scoped to merchant API keys and must be used for every merchant webhook flow.
---

Every generated merchant API key must have a paired `whsec_` webhook secret. The secret is returned only during key creation/regeneration or after password-gated reveal, and is never included in normal key listings or webhook payloads.

**Why:** Transaction-scoped random signing keys made it impossible for merchants to verify callbacks reliably; the API key is the stable credential that identifies the integration.

**How to apply:** Use the matched API key's secret for API-initiated pay-ins and the merchant's active environment key for dashboard-created QR/payment-link transactions. Keep the database column nullable only for legacy keys and provision missing secrets lazily.

Development schema changes must not accept an unrelated destructive `drizzle-kit push` prompt. This repo has legacy tables that may not exist in the current Drizzle schema. For Plesk/external Supabase production, do not assume Replit Publish updates the schema; apply only explicitly authorized, narrowly scoped SQL through the project's documented production connection workflow.

**Why:** An unrestricted push can remove legacy data-bearing tables, while Replit Publish does not migrate an external Supabase database used by Plesk.

**How to apply:** Inspect dev schema diffs before pushing. For external production, confirm the target and user authorization, apply only the intended SQL migration, verify the resulting schema, and never add runtime or deploy-time DDL.