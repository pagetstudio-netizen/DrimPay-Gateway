/**
 * Secret admin route prefix — set VITE_ADMIN_ROUTE_SECRET in your build environment.
 * Without it the prefix defaults to "admin" (backward compatible).
 *
 * Example Plesk .env.build (or Vite env file):
 *   VITE_ADMIN_ROUTE_SECRET=xk9m2p7q
 *
 * All admin API calls must use this constant instead of hard-coding "/api/admin".
 */
export const ADMIN_BASE = `/api/${import.meta.env.VITE_ADMIN_ROUTE_SECRET ?? "admin"}`;
