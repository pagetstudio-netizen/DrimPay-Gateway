---
name: Python shell runtime side effect
description: Replit can add a Python runtime module to .replit after a shell invocation in a Node workspace.
---

Running a one-off `python3` shell command in this Node.js workspace can cause Replit to add a Python module to `.replit`.

**Why:** this creates an unrelated toolchain configuration change even when Python was used only for reading or parsing.

**How to apply:** Prefer Node or `curl`/text tools for one-off parsing when practical. If Python was automatically added and is not needed, restore `.replit` through the validated configuration flow and verify `git status`.