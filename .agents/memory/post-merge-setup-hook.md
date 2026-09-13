---
name: Post-merge setup hook
description: Workspace configuration required for post-merge dependency installation and production builds.
---

The post-merge setup does not discover an existing script automatically; it must be configured with the workspace-relative script path and a timeout long enough for dependency installation and both artifact builds.

**Why:** A valid `scripts/post-merge.sh` existed, but the post-merge runner failed with `HOOK_NOT_FOUND` until the script path was explicitly registered.

**How to apply:** When the monorepo's post-merge setup is missing or reports `HOOK_NOT_FOUND`, register the existing post-merge script rather than creating a duplicate hook. Keep the script responsible for frozen dependency installation and the production build.