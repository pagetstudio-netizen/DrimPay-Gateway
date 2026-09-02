---
name: DrimPay gateway payload diagnostics
description: Rules for recording administrator-visible aggregator request snapshots.
---

Store sanitized merchant-request and gateway-submission snapshots so failed attempts remain diagnosable. Capture the gateway snapshot before calling an aggregator. Never persist authentication credentials, bearer tokens, private keys, or authorization headers.

**Why:** Provider failures often happen before an external reference is returned; retaining only successful responses makes the admin transaction view unable to explain failed submissions.

**How to apply:** Keep `request_payload` limited to the merchant input and `gateway_payload` focused on the selected endpoint and request parameters. Redact OTPs and secret-like metadata recursively. For Babimo, include the exact `payment_method`, `merchant_transaction_id`, `refercence_cl`, normalized telephone, and callback URLs.