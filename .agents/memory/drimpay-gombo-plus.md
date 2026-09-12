---
name: DrimPay Gombo Plus
description: Durable Gombo Plus API contract and routing constraints for DrimPay
---

Gombo Plus uses `X-Public-Key` and `X-Private-Key` headers. Pay-ins use `POST /api/mobile-services/mobile-deposit/`, payouts use `POST /api/mobile-services/mobile-withdrawal/`, status uses `POST /api/mobile-services/check-transaction-status/`, and balance uses `GET /api/wallets/get-balance/`.

**Why:** The provider documentation uses inconsistent naming (`GomboPlus`/`EgoPay`) and contains both `BN` and `BJ` for Benin, while DrimPay's existing country model uses `BJ`.

**How to apply:** Keep `BJ` as the internal and outgoing country code, normalize Togo `TMoney` to provider operator `yas`, and treat Burkina Faso Orange Money (`om`) as unavailable while the provider documents it under maintenance. Cashout activation is account-specific and must be confirmed with Gombo Plus before live payouts.

Gombo Plus cash-in requests use `amount`, `phone_number`, `country_code`, `operator`, `reference`, and `callback_url`. For Togo, `yas` is used for YAS/TMoney and `moov` for Moov.

**Why:** The provider confirmed the published documentation was outdated; the former `recipient_number`/`country` field names are rejected for cash-in.

**How to apply:** Keep the cash-in payload separate from the payout payload and send the DrimPay transaction reference in `reference`.

The long Gombo Plus public key may be stored in the admin settings table under `gomboplus_public_key`; keep the private key exclusively in the secure `GOMBOPLUS_PRIVATE_KEY` secret.

**Why:** Plesk environment fields can reject long public keys, while the private credential must never be exposed in the dashboard.

**How to apply:** Load the public setting before accepting requests, refresh the cached client after an admin update, and retain environment/chunked public-key fallback for existing installations.
