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

## Operator name matching (API vs DB)
- The public payin API docs tell merchants to send lowercase operator slugs (`tmoney`, `orange`, `mtn`, `moov`, `wave`), but `operators`/`operator_aggregators` tables store display names (`TMoney`, `Orange Money`, `MTN Mobile Money`...). Any lookup must compare normalized slugs (lowercase, strip "money"/"momo"/"mobile money", strip non-alphanumerics), not exact string equality — `aggregator-router.ts` now does this via `operatorSlug()`.
- **Why:** exact-match lookups silently failed for every operator (not just one), surfacing as "OPERATOR_UNAVAILABLE" for all operators despite every operator row being active — a naming-format mismatch masquerading as a config/outage problem.
- **How to apply:** any new code path that looks up an operator by name from external/API input must go through the slug-normalized helper, not `eq(operatorsTable.name, ...)`.

## Schema drift vs. live Supabase DB
- The Drizzle schema in `lib/db/src/schema/drimpay.ts` is not guaranteed to match the actual Supabase table (no migration ever ran that column in). A DB insert failing on a column that clearly exists in the schema file may mean the column is simply missing on Supabase — check `information_schema.columns` for the real table before assuming an app-logic bug.
- **Why:** `payment_links.image_url` existed in the Drizzle schema and app code but not in the live Supabase table, causing every payment-link creation to fail with an opaque generic error on the frontend.
- **How to apply:** when a DB write/read fails mysteriously (especially after importing/forking the project into a new environment), connect directly with `pg` using `SUPABASE_DATABASE_URL` (available in `lib/db`'s node_modules) and diff `information_schema.columns` (filtered to `table_schema='public'` — Supabase's `auth.users` also has a table named `users` and will pollute an unscoped query) against the Drizzle schema before debugging app code. Confirmed missing so far on the live Supabase DB: `payment_links.image_url`, `qr_codes.image_url`, `user_webhooks.api_key_id`, `user_allowed_ips.api_key_id`. Given the pattern, treat any "Erreur de chargement"/500 on an admin or dashboard detail panel as a likely missing-column issue first.
- Fastest way to pinpoint which column/table is missing without needing an authenticated session: write a throwaway `.mts` script in `artifacts/api-server/` (so `@workspace/db` resolves) running the exact same Drizzle queries as the failing route, and run it with `scripts/node_modules/.bin/tsx <file>` — the raw Drizzle error names the exact missing column, unlike the route's generic try/catch response.

## Two server processes serve two different bundles
- `Start application` (port 5000, via `start.cjs`) loads the **committed** `artifacts/api-server/dist/index.mjs` once at boot and never rebuilds/reloads it. `artifacts/api-server: API Server` (port 8080) is a separate dev workflow that rebuilds that same `dist/index.mjs` file on every restart.
- **Why:** after editing backend code, restarting only the `API Server` workflow rebuilds the file but `Start application` keeps running the old code already loaded in its process memory — testing against port 5000 then shows stale behavior and wastes a debugging cycle.
- **How to apply:** after any `artifacts/api-server` source change, restart `artifacts/api-server: API Server` first (to rebuild `dist/index.mjs`), then restart `Start application` too before testing/curling against port 5000.

## QR-pay vs. payment-link parity
- The QR-code payment flow (`POST/GET /qr/:reference` in `dashboard.ts`) and the payment-link flow (`pay.ts`) are separate code paths that were allowed to drift: QR used to fake success in live mode (no real Clapay/PayDunya call), showed all operators regardless of admin disable/maintenance flags, never returned the Wave `payment_url`, and had no Orange-Money OTP handling. Fixed by mirroring `pay.ts`'s aggregator-call / `checkOperatorAvailable` / `settlePayinStatus` / OTP pattern into the QR route, plus a new `listActiveOperators()` helper in `aggregator-router.ts` for the operator list shown to the QR payer.
- **Why:** any new payment entry point (QR, API, links) must reuse the same aggregator-router + settlement helpers, or it silently diverges into a fake/incomplete implementation that looks fine in sandbox but is broken in live mode.
- **How to apply:** when adding or auditing a new payin entry point, diff it against `pay.ts`'s `POST /pay/:token` handler for the same 4 things: real aggregator call in live mode, `checkOperatorAvailable` before charging, OTP requirement for Orange Money in CI/SN/BF, and `settlePayinStatus` as the single settlement point.

## Payout/reversement response latency
- Payout/reversement initiation must respond to the client immediately after the provider *accepts* the request; do not block the HTTP response on the provider's full settlement polling (which can take up to ~30s). Reverse-proxy timeouts (nginx/Plesk) are often shorter than that and turn a successful-but-slow payout into a client-visible "network error" even though money moved. Poll for final settlement in a background task instead, same pattern as the existing mass-payout flow.
