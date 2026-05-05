# DrimPay

DrimPay (Digital Reliable Infrastructure for Money) is a complete fintech platform website — a public marketing site and developer portal for an API-first payment infrastructure serving West & Central Africa.

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

Required env vars: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **Frontend**: React + Vite (wouter routing, framer-motion, shadcn/ui)
- **Backend**: Express 5 + Pino logging
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (server), generated Zod schemas (client)
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (CJS bundle for API server)

## Where things live

- `artifacts/drimpay/` — React+Vite frontend (previewPath: `/`)
- `artifacts/api-server/` — Express API server (port 8080, previewPath: `/api`)
- `lib/db/src/schema/drimpay.ts` — Full DB schema (all tables)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — Generated React Query hooks & Zod schemas
- `artifacts/drimpay/src/pages/` — All 24 page components
- `artifacts/drimpay/src/components/layout.tsx` — Header + Footer layout
- `artifacts/drimpay/src/index.css` — Dark theme CSS variables

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks. Never write fetch calls manually.
- **Dark mode forced**: `dark` class applied to `<html>` in `main.tsx`; `#C5FF4A` primary accent throughout.
- **Path-based proxy**: All services behind shared reverse proxy. API routes prefixed `/api`, frontend at `/`.
- **Drizzle ORM**: Schema-first with `drizzle-kit push` for development migrations; no migration files needed in dev.
- **Operator fallback routing**: API routes intelligently aggregate country + operator data from PostgreSQL.

## Product

24 pages covering: Home, About, How it Works, Pricing, Countries, Security, API Overview, API Docs, Businesses/KYB, Blog (listing + articles), News, Careers (listing + detail), Contact, Status, Partners, Help Center, Terms, Privacy, Developer Portal, Dashboard Preview, Login, Signup.

Backend API endpoints: `/api/stats/platform`, `/api/blog/articles`, `/api/blog/categories`, `/api/blog/articles/:slug`, `/api/jobs`, `/api/jobs/:id`, `/api/contact` (POST), `/api/status/services`, `/api/status/incidents`, `/api/partners`, `/api/countries`.

## User preferences

- Dark mode only — no light mode toggle
- No emojis in UI
- `#C5FF4A` electric lime accent on deep near-black background
- Enterprise fintech aesthetic — dense information, serious design

## Gotchas

- API server build takes ~30s (esbuild + TypeScript); workflow timeout may race with port detection — restart if it reports DIDNT_OPEN_A_PORT.
- Use `z.string().email()` not `z.email()` in API server (Zod v3, not v4).
- Blog/jobs seeding must use psql directly (not executeSql tool) due to multi-line string handling.
- `pnpm-workspace.yaml` catalog pins shared package versions — use `"catalog:"` for already-pinned deps.

## Pointers

- `.local/skills/pnpm-workspace/references/openapi.md` — OpenAPI + codegen setup
- `.local/skills/pnpm-workspace/references/server.md` — Express route patterns
- `.local/skills/pnpm-workspace/references/db.md` — Drizzle schema + migrations
