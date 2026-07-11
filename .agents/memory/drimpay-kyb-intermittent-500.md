---
name: DrimPay intermittent "Erreur serveur" pattern
description: How to reason about routes that fail intermittently (not consistently) on Supabase Storage/DB writes.
---

- Intermittent (not consistent) 500s on a route doing external Storage/DB writes point to unretried transient network blips or an unguarded `undefined` after a write returns zero rows — not schema drift. Schema drift fails the same way every time.
- A retry wrapper around a DB write is only safe if the write is idempotent (upsert via a real unique constraint). Retrying a plain check-then-insert can create duplicate rows if the first attempt actually committed before the client saw a (transient) error.
- **Why:** a caught intermittent-failure bug crashed on reading a field off a write result without checking it was defined; a naive retry-the-insert fix for the same bug would have silently introduced duplicate-row creation instead.
- **How to apply:** before adding retry to any DB write, confirm it's an atomic upsert (or otherwise naturally idempotent), not a separate check-then-branch; add a defensive check after any `[row] = await db.insert/update(...).returning()` before dereferencing `row`.
