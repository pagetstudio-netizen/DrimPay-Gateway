---
name: DrimPay Babimo routing
description: Babimo/B-Pay country-specific contracts and the admin-controlled routing decision.
---

Babimo's API uses a login token from `authorisation.token`, Bearer requests, `/paiement`, `/collect/cashin`, and `/check-status/{status_token}`. The documented client reference field is misspelled `refercence_cl`. Côte d'Ivoire uses `MTN_CI`, `OM_CI`, `WAVE_CI`, and `MOOV_CI`; Benin uses `BN_CASHIN_MTN` for pay-in and `BN_PM_MTN` for payout; Burkina uses `BF_PM_OM`/`BF_PM_MOOV` for pay-in and `BF_CASHIN_ORANGE`/`BF_CASHIN_MOOV` for payout.

**Why:** The provider collection is the reliable contract source, while routing must remain selectable by the administrator rather than forcing all operators to Babimo.

**How to apply:** Keep `BABIMO_<COUNTRY>_EMAIL` and `BABIMO_<COUNTRY>_PASSWORD` in Replit Secrets, with an optional country-specific base URL. Add Babimo as an aggregator definition and let admin operator mappings choose it; initially preserve existing CI PayDunya mappings until an administrator changes them.

Babimo requires `refercence_cl` in payment requests as the provider-assigned client reference, separate from `merchant_transaction_id`; keep the current account value outside the repository.

**Why:** Babimo's team rejected generated references for the account and supplied a fixed client reference to use in the payment body; provider identifiers should not be committed.

**How to apply:** Keep the provider's exact spelling, read `BABIMO_<COUNTRY>_CLIENT_REFERENCE` from the runtime secret store, and never substitute a payment-link URL or an empty placeholder.

Provider callbacks are not sufficient as the only settlement mechanism: pending Babimo pay-ins need periodic status reconciliation through the stored provider reference, using the same idempotent settlement path as webhook notifications.

**Why:** Mobile-money approval can happen after the short HTTP polling window, and a missing or unrecognized `notify_url` payload otherwise leaves a successful payment pending indefinitely.

**How to apply:** Keep reconciliation scoped to transactions explicitly recorded as routed to Babimo; transient provider errors must leave the transaction pending rather than manufacturing a failure.