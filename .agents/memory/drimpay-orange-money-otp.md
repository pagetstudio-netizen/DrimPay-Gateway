---
name: DrimPay Orange Money OTP requirement
description: Which Orange Money countries need a USSD-generated OTP before PayDunya SoftPay will accept the payment, and the exact field names.
---

- PayDunya's SoftPay endpoint requires a USSD-generated confirmation code as part of the request body for Orange Money in **CI** (`orange_money_ci_otp`) and **BF** (`otp_code`); Senegal's legacy endpoint follows the same CI naming convention (`orange_money_sn_otp`) even though PayDunya's current public docs only show a newer QR-code flow for SN. **Mali needs no code at all** — the customer confirms entirely on their phone via USSD.
- **Why:** confirmed against PayDunya's official softpay docs (per-country field names differ, e.g. BF uses non-namespaced `name_bf`/`email_bf`/`phone_bf`+`otp_code` while CI/SN use `orange_money_{cc}_*` prefixed fields) — guessing a single shared field name across countries would silently fail the SoftPay call.
- **How to apply:** any new Orange Money country integration must be checked individually against PayDunya's softpay doc page (https://developers.paydunya.com/doc/EN/softpay) for its exact field names before assuming the OTP flow is uniform; don't extrapolate from one country to another.
- The USSD codes shown to the customer differ per country too: BF `*144*4*6*[amount]#`, CI/SN `#144*82#`, ML `#144#` → "Paiement marchand" (option 2). These are surfaced on `artifacts/drimpay/src/pages/pay.tsx` (frontend instructions) and documented on `/docs/payin#orange-otp`.
