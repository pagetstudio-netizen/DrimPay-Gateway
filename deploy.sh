#!/usr/bin/env bash
set -e

echo "==> [DrimPay Deploy] Starting deployment..."

# ── 1. Install pnpm if missing ─────────────────────────────────────────────────
if ! command -v pnpm &> /dev/null; then
  echo "==> Installing pnpm..."
  npm install -g pnpm@10
fi

# ── 2. Install all dependencies ────────────────────────────────────────────────
echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

# ── 3. Build API server ────────────────────────────────────────────────────────
echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

# ── 4. Build frontend ──────────────────────────────────────────────────────────
echo "==> Building frontend..."
pnpm --filter @workspace/drimpay run build

# ── 5. Restart PM2 process (if PM2 is available) ──────────────────────────────
if command -v pm2 &> /dev/null; then
  echo "==> Restarting PM2 process..."
  pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "==> [DrimPay Deploy] Done."
