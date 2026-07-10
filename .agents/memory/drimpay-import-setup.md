---
name: DrimPay import setup
description: What's needed to get the DrimPay project running after a fresh import, and a startup quirk to know about.
---

- The prebuilt server bundle (`artifacts/api-server/dist/index.mjs`, loaded via `start.cjs`) is committed to git — the `Start application` workflow does not rebuild it. Adding secrets requires only a workflow restart, not a rebuild, for env vars to take effect at startup (Supabase Storage bucket setup, aggregator tokens, etc. are read at process start).
- Minimum secrets to get core app + KYB storage working: `SUPABASE_DATABASE_URL`, `SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`. Payment provider keys (Clapay, PayDunya) are separate and only needed for real pay-in/pay-out flows.
- **Why:** without `SUPABASE_SERVICE_ROLE_KEY` the server logs "skipping KYB bucket setup" and document uploads 500; without provider tokens, payment flows fail but the rest of the app runs fine.
