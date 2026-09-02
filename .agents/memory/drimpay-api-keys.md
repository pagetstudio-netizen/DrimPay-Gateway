---
name: DrimPay API key access
description: Sandbox API keys are available before KYB approval; Live keys remain KYB-gated.
---

Sandbox API keys must remain accessible to authenticated merchants before KYB approval. Only Live key creation and regeneration require an approved KYB status, and that restriction must be enforced in both the dashboard UI and API routes.

**Why:** Merchants need credentials to integrate and test before their production account is activated; gating the entire page prevents the documented Sandbox onboarding flow.

**How to apply:** Keep the API-key page visible for pending, submitted, under-review, and rejected KYB states. Disable or reject Live operations until the merchant is approved, while allowing Sandbox operations.