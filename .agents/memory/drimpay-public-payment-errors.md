---
name: DrimPay public payment errors
description: Customer-safe error codes and localized messages for public payment flows.
---

Public payment pages must show localized messages selected from controlled error codes, never raw provider or API failure text. Keep detailed failure reasons in internal transaction records and preserve operations notifications. Treat connection and socket failures as temporary; map operator availability, invalid input, and payment-link state to specific safe categories.

**Why:** Provider responses can contain technical diagnostics that should not be exposed to payers, while the operations team still needs the original failure context.

**How to apply:** When changing public pay-in error responses, keep API-side classification and browser-side localization aligned and verify both French and English output.