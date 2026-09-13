---
name: Browser source visibility
description: Security boundary for frontend code, internal screens, and administrator data.
---

Anything shipped to a browser can be viewed through developer tools; JavaScript obfuscation or disabling inspect cannot be treated as security. Internal screens may be lazy-loaded to keep them out of the public entry bundle, but every administrator API must enforce authentication and authorization on the server.

**Why:** The public site was mistaken for exposing administrator logs because its SPA bundle contained protected route components. The actual logs endpoint correctly rejected unauthenticated access.

**How to apply:** Treat browser-visible code as public. Use lazy loading for reducing accidental exposure and initial bundle size, while relying on server-side session and role checks for all admin, support, wallet, and audit data.