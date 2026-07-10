---
name: Pay page polling bug — !r.ok early exit
description: Critical bug in pay.tsx polling: non-200 HTTP response kills the poll permanently.
---

## The bug
In `artifacts/drimpay/src/pages/pay.tsx`, the polling useEffect had:
```js
const r = await fetch(`${BASE}/api/pay/status/${txRef}`);
if (!r.ok) return;  // KILLS POLLING — attempts++ and setTimeout never run
```
Because `attempts++` and `setTimeout(poll, 5000)` were AFTER the try/catch block, an early `return` inside the try block bypassed them entirely. Any single non-200 response (transient 500, network blip) silently stopped the poll forever — the page stayed stuck on the blue "En attente de confirmation" spinner even though the transaction was confirmed in DB and Telegram was sent.

**Why:** confirmed payin (webhook settled it, Telegram sent, DB = "success") but frontend never transitioned to success page.

**Fix:** moved status check inside `if (r.ok) { ... }`, let non-OK fall through to `attempts++` / `setTimeout`. Terminal states (success/failed) still stop with an explicit `return` AFTER setting state.

## Clapay webhook atomic settlement
The Clapay webhook (`artifacts/api-server/src/routes/clapay-webhook.ts`) was doing a non-atomic payin settlement: separate DB status update + wallet credit. Replaced with `settlePayinStatus` (same as PayDunya webhook) for atomicity and idempotence.

**How to apply:** any new webhook or settlement path must use `settlePayinStatus` for payins — never write ad-hoc status + wallet updates.
