---
name: DrimPay API wallet modes
description: Durable rule for keeping API transactions, wallets, and settlement credits isolated between Sandbox and Live.
---

The API must resolve and create wallets using the environment derived from the API key, and idempotency must include that environment. Settlement must verify that the transaction mode and wallet mode match before crediting.

**Why:** A production API pay-in can otherwise reuse an existing country wallet whose default mode is Sandbox, causing successful Live pay-ins and their fees/statistics to appear in the wrong wallet.

**How to apply:** Whenever an API route selects, creates, updates, or settles a wallet, include the resolved mode in the database predicate or validate the linked wallet mode before applying the balance change.