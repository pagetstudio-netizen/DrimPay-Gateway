---
name: DrimPay Gombo Plus
description: Durable Gombo Plus API contract and routing constraints for DrimPay
---

Gombo Plus uses `X-Public-Key` and `X-Private-Key` headers. Pay-ins use `POST /api/mobile-services/mobile-deposit/`, payouts use `POST /api/mobile-services/mobile-withdrawal/`, status uses `POST /api/mobile-services/check-transaction-status/`, and balance uses `GET /api/wallets/get-balance/`.

**Why:** The provider documentation uses inconsistent naming (`GomboPlus`/`EgoPay`) and contains both `BN` and `BJ` for Benin, while DrimPay's existing country model uses `BJ`.

**How to apply:** Keep `BJ` as the internal and outgoing country code, normalize Togo `TMoney` to provider operator `yas`, and treat Burkina Faso Orange Money (`om`) as unavailable while the provider documents it under maintenance. Cashout activation is account-specific and must be confirmed with Gombo Plus before live payouts.