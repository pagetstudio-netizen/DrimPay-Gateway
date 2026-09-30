# DrimPay

DrimPay is a complete fintech platform — a public marketing/developer site plus a full merchant dashboard for API-first Mobile Money payment infrastructure across West & Central Africa.

## Run & Operate

- Replit preview: use the **Start application** workflow (`pnpm install && PORT=5000 node start.cjs`). It serves the public site and API together on port 5000 from the committed build.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

Required for database-backed features: `SUPABASE_DATABASE_URL`, `SESSION_SECRET`

> The app uses `SUPABASE_DATABASE_URL` (primary) with `DATABASE_URL` as fallback. Always set `SUPABASE_DATABASE_URL` on any deployment (Plesk, production, etc.).
> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` configure Supabase Storage. The service-role key is mandatory for KYB document uploads (bucket `kyb-documents`); without it, document uploads fail.
> The public site can render without Supabase, but sign-in, dashboard data, and KYB features need a working Supabase project and its schema.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **Frontend**: React + Vite (wouter routing, framer-motion, shadcn/ui)
- **Backend**: Express 5 + Pino logging
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Validation**: Zod (server), generated Zod schemas (client)
- **Build**: esbuild (CJS bundle for API server)

## Where things live

- `artifacts/drimpay/` — React+Vite frontend (previewPath: `/`)
- `artifacts/api-server/` — Express API server (port 8080, previewPath: `/api`)
- `lib/db/src/schema/drimpay.ts` — Full DB schema (all tables)
- `artifacts/drimpay/src/pages/` — All page components
- `artifacts/drimpay/src/pages/dashboard/` — Merchant dashboard pages
- `artifacts/drimpay/src/pages/dashboard/layout.tsx` — Sidebar dashboard layout
- `artifacts/drimpay/src/components/layout.tsx` — Public site header + footer
- `artifacts/api-server/src/routes/dashboard.ts` — Merchant dashboard API routes

## Architecture decisions

- **Dashboard uses separate layout**: `/dashboard/*` routes skip the public Layout (no header/footer), use a sidebar instead. Routing conditional in `App.tsx` based on path prefix.
- **Geo-isolated wallets**: Each merchant has one wallet per country. Pay-ins credit the wallet of the country where the payment originates. Pay-outs can only debit the same country's wallet. No cross-country transfers.
- **3% flat fee**: Applied to every pay-in and pay-out. Fee deducted from net amount on pay-in; added to total debit on pay-out.
- **KYB not KYC**: Business verification collects RCCM, statuts, registration number, business type, incorporation country, address.
- **Dark mode forced**: `dark` class on `<html>`; `#C5FF4A` primary accent on deep near-black background.
- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks for public-facing pages.

## Product

**Public site** (25 pages): Home, About, How it Works, Pricing, Countries, Security, API Overview, Docs, Businesses, Blog, News, Careers, Contact, Status, Partners, Help, Terms, Privacy, Developer Portal, Dashboard Preview, Login, Signup.

**Merchant Dashboard** (11 pages under `/dashboard`):
- Overview, Wallets (per-country), Pay-in, Pay-out, API Keys, KYB Verification
- API Docs: Pay-in, Pay-out, Virtual Cards, Communication Credits, Mass Payout

**Backend** (`/api/dashboard/*`): overview, wallets, transactions, payin, payout, api-keys, kyb

## User preferences

- Dark mode only — no light mode toggle
- No emojis in UI copy (navigation/body text)
- `#C5FF4A` electric lime accent on deep near-black background
- Enterprise fintech aesthetic — dense information, serious design
- French language in dashboard UI; English on public site

## Deployment (Plesk)

### Workflow de déploiement

**Les fichiers compilés (`dist/`) sont suivis dans git.** Le serveur Plesk utilise ces bundles préconstruits; il ne compile pas l'application.

**Sur Replit, avant de pousser des changements :**
```bash
pnpm run deploy
```
Cette commande installe les dépendances verrouillées, vérifie le typecheck du workspace, exécute les tests API, puis reconstruit le serveur et le frontend. Vérifier ensuite `git status` et inclure les changements sous `dist/` dans le commit.

**Sur GitHub :** committer et pousser les sources ainsi que les fichiers `dist/`.

**Dans Plesk :** utiliser **Pull + Deploy Now**, puis redémarrer l'application Node.js/Passenger. Aucun build ni `pnpm install` n'est nécessaire sur Plesk.

En SSH, le script dédié fait le pull, vérifie les bundles et variables requises, puis redémarre Passenger :
```bash
bash scripts/deploy-plesk.sh
```

### Variables d'environnement obligatoires sur Plesk
- `SUPABASE_DATABASE_URL` — URL complète Supabase PostgreSQL (Settings > Database)
- `SUPABASE_URL` — URL du projet Supabase, requise par le client Storage côté serveur
- `SESSION_SECRET` — clé secrète aléatoire longue
- `NODE_ENV=production`
- `SUPABASE_SERVICE_ROLE_KEY` — clé service role Supabase (Settings > API > service_role). À conserver uniquement dans les variables d'environnement Plesk; elle est requise pour le stockage des documents KYB et des images.

### Fichier de démarrage Plesk (IMPORTANT)
```
start.cjs
```
Configurer l'application Plesk avec **Node.js 20 ou supérieur** (le bundle serveur cible Node 20).
> **Ne pas utiliser** `artifacts/api-server/dist/index.mjs` directement — Passenger charge les fichiers `.mjs` via `require()` ce qui provoque `ERR_REQUIRE_ESM`. Le wrapper `start.cjs` charge correctement le bundle ESM via `import()` dynamique.
> Pas besoin de `pnpm install` ni de `npm run build` sur Plesk — tout est déjà compilé.
>
> En cas de crash : lire `logs/startup-errors.log` depuis le File Manager Plesk.

## Gotchas

- API server build takes ~30s; restart workflow if DIDNT_OPEN_A_PORT error.
- Use `z.string().email()` not `z.email()` in API server (Zod v3, not v4).
- Dashboard routes bypass the public Layout — they render their own `DashboardLayout`.
- Wallet created automatically on first pay-in for a given country.
- Always use `SUPABASE_DATABASE_URL` — psql direct uses `DATABASE_URL` (local, empty). Use `psql "$SUPABASE_DATABASE_URL"` for direct DB access.

## Pointers

- `.local/skills/pnpm-workspace/references/db.md` — Drizzle schema + migrations
- `.local/skills/pnpm-workspace/references/server.md` — Express route patterns
