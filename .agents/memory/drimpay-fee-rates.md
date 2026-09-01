---
name: DrimPay fee rate resolution
description: New transaction fees can be overridden by country/operator while preserving merchant-specific overrides.
---

Fee resolution is done when a transaction is created: an explicit merchant fee override has priority, then the platform country/operator rule, then the platform default. Existing transactions keep their stored fee.

**Why:** Merchant-specific pricing already exists and is more specific than a global operator rule; changing the platform rule must still affect all merchants without rewriting historical transactions.

**How to apply:** Pass the transaction's country and canonical or API operator name to the shared fee resolver for pay-ins, payouts, QR codes, payment links, reversements, and mass payouts. Store operator rules as admin settings and validate percentages from 0 to 100.

Babimo mass payout is supported as a batch orchestration of individual payout calls, not as a native bulk provider endpoint. Each recipient must use a supported country/operator payout mapping and be validated before the job debits wallets.

**Why:** The available Babimo contract exposes per-payout `/collect/cashin` and status polling, with no documented bulk endpoint.

**How to apply:** Keep the mass-payout route per recipient and fail fast on an unavailable or unsupported route before creating the job.