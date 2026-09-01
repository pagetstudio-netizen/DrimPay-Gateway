---
name: DrimPay merchant webhook secrets
description: Stable HMAC credentials are scoped to merchant API keys and must be used for every merchant webhook flow.
---

Every generated merchant API key must have a paired `whsec_` webhook secret. The secret is returned only during key creation/regeneration or after password-gated reveal, and is never included in normal key listings or webhook payloads.

**Why:** Transaction-scoped random signing keys made it impossible for merchants to verify callbacks reliably; the API key is the stable credential that identifies the integration.

**How to apply:** Use the matched API key's secret for API-initiated pay-ins and the merchant's active environment key for dashboard-created QR/payment-link transactions. Keep the database column nullable only for legacy keys and provision missing secrets lazily.

Development schema changes must not accept an unrelated destructive `drizzle-kit push` prompt. If schema introspection proposes deleting existing data-bearing tables, apply only the intended non-destructive column change and leave production migration to the publish flow.

**Why:** This monorepo can contain database tables not represented by the current Drizzle schema, so an unrestricted push can remove unrelated user data.

**How to apply:** Inspect the proposed diff before pushing; production should be updated by re-publishing, not by runtime or deployment-time DDL.