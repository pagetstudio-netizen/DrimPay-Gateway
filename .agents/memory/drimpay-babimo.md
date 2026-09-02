---
name: DrimPay Babimo routing
description: Babimo/B-Pay country-specific contracts and the admin-controlled routing decision.
---

Babimo's API uses a login token from `authorisation.token`, Bearer requests, `/paiement`, `/collect/cashin`, and `/check-status/{status_token}`. The documented client reference field is misspelled `refercence_cl`. Côte d'Ivoire uses `MTN_CI`, `OM_CI`, `WAVE_CI`, and `MOOV_CI`; Benin uses `BN_CASHIN_MTN` for pay-in and `BN_PM_MTN` for payout; Burkina uses `BF_PM_OM`/`BF_PM_MOOV` for pay-in and `BF_CASHIN_ORANGE`/`BF_CASHIN_MOOV` for payout.

**Why:** The provider collection is the reliable contract source, while routing must remain selectable by the administrator rather than forcing all operators to Babimo.

**How to apply:** Keep `BABIMO_<COUNTRY>_EMAIL` and `BABIMO_<COUNTRY>_PASSWORD` in Replit Secrets, with an optional country-specific base URL. Add Babimo as an aggregator definition and let admin operator mappings choose it; initially preserve existing CI PayDunya mappings until an administrator changes them.

Babimo requires `refercence_cl` in payment requests as the provider-assigned client reference, separate from `merchant_transaction_id`; Côte d'Ivoire's current DrimPay account reference is `6ybmu2b`.

**Why:** Babimo's team rejected generated references for the account and supplied a fixed client reference to use in the payment body.

**How to apply:** Keep the provider's exact spelling, use `BABIMO_<COUNTRY>_CLIENT_REFERENCE` when configured (CI currently defaults to `6ybmu2b`), and never substitute a payment-link URL or an empty placeholder.