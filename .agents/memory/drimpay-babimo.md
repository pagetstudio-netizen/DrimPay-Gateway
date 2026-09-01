---
name: DrimPay Babimo routing
description: Babimo/B-Pay country-specific contracts and the admin-controlled routing decision.
---

Babimo's API uses a login token from `authorisation.token`, Bearer requests, `/paiement`, `/collect/cashin`, and `/check-status/{status_token}`. The documented client reference field is misspelled `refercence_cl`. Côte d'Ivoire uses `MTN_CI`, `OM_CI`, `WAVE_CI`, and `MOOV_CI`; the Benin collection documents MTN pay-in as `BN_CASHIN_MTN` and payout as `BN_PM_MTN`.

**Why:** The provider collection is the reliable contract source, while routing must remain selectable by the administrator rather than forcing all operators to Babimo.

**How to apply:** Keep `BABIMO_<COUNTRY>_EMAIL` and `BABIMO_<COUNTRY>_PASSWORD` in Replit Secrets, with an optional country-specific base URL. Add Babimo as an aggregator definition and let admin operator mappings choose it; initially preserve existing CI PayDunya mappings until an administrator changes them.