#!/bin/bash
set -e

# Install dependencies (frozen lockfile — fast if already up to date)
pnpm install --frozen-lockfile

# Build API server and frontend (parallel)
pnpm --filter @workspace/api-server run build &
pnpm --filter @workspace/drimpay run build &
wait
