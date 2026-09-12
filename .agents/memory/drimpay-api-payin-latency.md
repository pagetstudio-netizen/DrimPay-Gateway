---
name: DrimPay API pay-in latency
description: Performance contract for API pay-in initiation and asynchronous provider status handling.
---

The API pay-in initiation endpoint must return as soon as the aggregator accepts the payment and returns its payment URL or provider reference. Customer approval and provider status polling happen after the response, with the webhook and status endpoint remaining authoritative for the final state.

**Why:** Mobile-money prompts, especially Wave, can remain pending for several seconds while the customer approves them. Waiting for a polling window makes a successful initiation look slow or unavailable to API clients.

**How to apply:** Keep the initiation response at `processing` until settlement is confirmed. Run polling in the background only as a reconciliation aid, and always use the atomic settlement path so a webhook and a late poll cannot double-credit the wallet.