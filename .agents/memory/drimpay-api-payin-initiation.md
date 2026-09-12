---
name: DrimPay API pay-in initiation
description: The API contract separating gateway acceptance from final payment settlement.
---

API pay-in initiation is provisional: once the aggregator returns its reference or payment URL, respond with `processing` immediately. Final status and wallet credit belong to the idempotent polling/webhook settlement path.

**Why:** Customer approval can take several seconds, and waiting for it makes API clients time out even though the payment has already been created successfully.

**How to apply:** Keep initiation responses independent from status polling. Preserve the same settlement function for background polling and webhooks so either confirmation order is safe.