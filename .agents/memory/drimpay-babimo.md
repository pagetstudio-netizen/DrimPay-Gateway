---
name: DrimPay Babimo routing
description: Babimo/B-Pay Côte d'Ivoire contract and the admin-controlled routing decision.
---

Babimo's Côte d'Ivoire API uses a login token from `authorisation.token`, Bearer requests, `/paiement`, `/collect/cashin`, and `/check-status/{status_token}`. Its operator codes are `MTN_CI`, `OM_CI`, `WAVE_CI`, and `MOOV_CI`, and the documented client reference field is misspelled `refercence_cl`.

**Why:** The provider collection is the reliable contract source, while routing must remain selectable by the administrator rather than forcing all operators to Babimo.

**How to apply:** Keep `BABIMO_<COUNTRY>_EMAIL` and `BABIMO_<COUNTRY>_PASSWORD` in Replit Secrets, with an optional country-specific base URL. Add Babimo as an aggregator definition and let admin operator mappings choose it; initially preserve existing CI PayDunya mappings until an administrator changes them.