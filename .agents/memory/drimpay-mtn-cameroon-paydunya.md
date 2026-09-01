---
name: DrimPay MTN Cameroon PayDunya mapping
description: Official PayDunya identifiers and payload contract for MTN Cameroon pay-ins and payouts.
---

PayDunya's official MTN Cameroon identifier is `mtn-cameroun` for both SoftPay and disbursement. SoftPay requires the namespaced `mtn_cameroun_customer_fullname`, `mtn_cameroun_email`, `mtn_cameroun_phone_number`, and `mtn_cameroun_wallet_provider: "MTNCAMEROUN"` fields. Disbursement uses the same `withdraw_mode` and passes the merchant reference as optional `disburse_id` when submitting the invoice, not when creating it.

**Why:** The legacy-looking `mtn-cm` endpoint and `mtn_cm_*` fields return HTML instead of the expected JSON response, while the official documentation lists the Cameroon-specific names above.

**How to apply:** Check the official PayDunya SoftPay and disbursement docs before changing country-specific identifiers; do not infer Cameroon names from Côte d'Ivoire or Benin mappings.