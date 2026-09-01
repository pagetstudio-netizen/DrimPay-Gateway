---
name: DrimPay security baseline
description: Durable secret-handling and security-audit constraints for the DrimPay repository
---

Real payment, database, storage, email, and session credentials must exist only in the deployment secret manager. The repository may keep variable names and blank `.env.example` entries, but not realistic credential-shaped examples or secret metadata such as key lengths in logs.

**Why:** This project tracks generated API and frontend `dist/` artifacts for Plesk deployment, so a source-only secret scan can miss stale content that will be pushed to GitHub.

**How to apply:** Scan both tracked source and tracked build output before releases, keep runtime diagnostic logs ignored, and use parameterized Drizzle SQL templates rather than raw SQL concatenation.