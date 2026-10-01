---
name: DrimPay admin payout actions
description: Settlement safety rules for administrator verification and manual approval of payouts.
---

Only synchronize live payouts that are pending or processing, and query the provider recorded in that payout's gateway snapshot rather than current routing. Apply only final provider statuses. A confirmed success completes the payout without another wallet debit; a confirmed failure refunds the original debit (amount plus fee) atomically with the status transition, guarded so concurrent webhooks or admin actions cannot refund twice. Require the payout's wallet mode to match the transaction mode before refunding. Manual approval marks an eligible live payout successful without contacting a provider or debiting the wallet again.

**Why:** Payouts debit the wallet when initiated, while provider callbacks, background polling, and administrator actions can race. Using current routing or applying a refund without an atomic status guard could query the wrong provider or duplicate funds.

**How to apply:** Preserve these boundaries in any payout reconciliation, retry, webhook, or administrator workflow. Sandbox payouts and already-final transactions must never trigger this admin settlement flow.