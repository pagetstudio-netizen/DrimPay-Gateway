---
name: DrimPay gateway payload diagnostics
description: Rules for recording administrator-visible aggregator request snapshots.
---

Store a sanitized gateway submission snapshot before calling an aggregator so failed attempts remain diagnosable. Never persist authentication credentials, bearer tokens, private keys, or authorization headers.

**Why:** Provider failures often happen before an external reference is returned; retaining only successful responses makes the admin transaction view unable to explain failed submissions.

**How to apply:** Keep `gateway_payload` focused on the selected endpoint and request parameters. For Babimo, include the exact `payment_method`, `merchant_transaction_id`, `refercence_cl`, normalized telephone, and callback URLs.