---
name: DrimPay OTP "email et code requis" despite correct code
description: Why manual OTP code entry can fail on /verify-email while the emailed activation link always works.
---

- The activation link only needs `token` (query param, GET) so it always works. Manual code entry POSTs `{email, code}` — if the page's `?email=` is ever lost (tab restored without query string, link rewritten by a corporate email scanner, etc.), the frontend silently sends `email: ""` and the backend correctly replies "Email et code requis" — even though the code the user typed was correct.
- **Why:** `verify-email.tsx` had no fallback for a missing email — trusted `window.location.search` alone.
- **How to apply:** login/signup now also stash the email in `sessionStorage` (`dp_verify_email`) before redirecting to `/verify-email`, which falls back to it if the URL param is empty, and shows an explicit "email introuvable, retournez à la connexion" message instead of silently failing. Apply the same pattern to any other flow that redirects to a code-entry page via a full page navigation with the identity carried only in the URL.
- Also split `emailSendRateLimiter` (3/min, for actually sending emails: resend/forgot-password) from a separate `codeVerifyRateLimiter` (10/min, for verify-email/verify-reset-code) — they used to share one limiter/bucket, so a couple of "resend" clicks could exhaust the quota and make the next real verify attempt fail with a misleading rate-limit error.
