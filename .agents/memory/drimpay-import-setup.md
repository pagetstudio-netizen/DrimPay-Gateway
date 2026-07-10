---
name: DrimPay import setup
description: What's needed to get the DrimPay project running after a fresh import, and a startup quirk to know about.
---

- The prebuilt server bundle (`artifacts/api-server/dist/index.mjs`, loaded via `start.cjs`) is committed to git — the `Start application` workflow does not rebuild it. Adding secrets requires only a workflow restart, not a rebuild, for env vars to take effect at startup (Supabase Storage bucket setup, aggregator tokens, etc. are read at process start).
- Minimum secrets to get core app + KYB storage working: `SUPABASE_DATABASE_URL`, `SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`. Payment provider keys (Clapay, PayDunya) are separate and only needed for real pay-in/pay-out flows.
- **Why:** without `SUPABASE_SERVICE_ROLE_KEY` the server logs "skipping KYB bucket setup" and document uploads 500; without provider tokens, payment flows fail but the rest of the app runs fine.

## PayDunya integration gotchas
- PayDunya payout is a stub in this codebase; only Clapay handles real payouts. Payout routing must always resolve/fallback per-operation ("payin" vs "payout"), never assume one aggregator handles both directions for a given operator.
- PayDunya's real checkout-invoice IPN wraps all fields under a top-level `data` key. Any webhook parser here must unwrap `body.data` before reading `invoice`/`custom_data`/`hash`, or real webhooks silently fail to match and confirmed payins look stuck.
- **Why:** both caused user-visible false failures despite the provider actually confirming/receiving funds — always verify against real provider payload shape, not assumptions from docs alone.

## Payin/payout settlement architecture
- Wallet crediting/refunding must happen in exactly one place (a shared, transactional settlement helper) called by both the synchronous post-initiation status check and the async webhook — never let each path credit/refund independently. Guard with an atomic conditional UPDATE (`WHERE status NOT IN (<all terminal states>)`) inside the same DB transaction as the balance change, so a crash mid-flow can't leave a transaction "settled" without its balance effect, and so webhook + polling racing on the same transaction can't double-credit or double-refund.
- **Why:** without atomicity, two independent status-confirmation paths (webhook vs. synchronous poll) racing on the same transaction is exactly how "provider confirmed, wallet never credited" and "double refund" bugs happen in this app.
- **How to apply:** whenever adding a new status-confirmation path (new aggregator, new webhook, admin manual override), route it through the shared settlement helper rather than writing ad hoc status/balance updates.

## Payout/reversement response latency
- Payout/reversement initiation must respond to the client immediately after the provider *accepts* the request; do not block the HTTP response on the provider's full settlement polling (which can take up to ~30s). Reverse-proxy timeouts (nginx/Plesk) are often shorter than that and turn a successful-but-slow payout into a client-visible "network error" even though money moved. Poll for final settlement in a background task instead, same pattern as the existing mass-payout flow.
