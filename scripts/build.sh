#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# DrimPay — Build Replit
#
# Lance ce script avant chaque push GitHub.
# Les fichiers compilés (dist/) sont inclus dans git → Plesk n'a qu'à
# faire git pull + restart, sans aucun build ni pnpm install.
#
# Usage :
#   bash scripts/build.sh
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
log()    { echo -e "${BLUE}[build]${NC} $1"; }
ok()     { echo -e "${GREEN}[ok]${NC} $1"; }
warn()   { echo -e "${YELLOW}[warn]${NC} $1"; }
error()  { echo -e "${RED}[erreur]${NC} $1"; exit 1; }
section(){ echo -e "\n${BOLD}${BLUE}── $1 ──${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${BLUE}   DrimPay — Build — $(date '+%d/%m/%Y %H:%M:%S')${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 1. Dépendances ────────────────────────────────────────────────────────────
section "1/4  Dépendances"
log "Vérification des dépendances..."
pnpm install --frozen-lockfile || error "pnpm install échoué"
ok "Dépendances OK"

# ── 2. Typecheck ──────────────────────────────────────────────────────────────
section "2/4  Typecheck"
log "Vérification TypeScript..."
pnpm run typecheck:libs || error "Typecheck librairies échoué"
ok "TypeScript OK"

# ── 3. Build API Server ───────────────────────────────────────────────────────
section "3/4  Build API Server"
log "Compilation du serveur Express (esbuild)..."
pnpm --filter @workspace/api-server run build || error "Build API server échoué"

BUNDLE="artifacts/api-server/dist/index.mjs"
if [ ! -f "$BUNDLE" ]; then
  error "Bundle introuvable après build : $BUNDLE"
fi
BUNDLE_SIZE=$(du -sh "$BUNDLE" | cut -f1)
ok "Bundle API server créé — $BUNDLE_SIZE  →  $BUNDLE"

# ── 4. Build Frontend ─────────────────────────────────────────────────────────
section "4/4  Build Frontend"
log "Compilation du frontend React (Vite)..."
pnpm --filter @workspace/drimpay run build || error "Build frontend échoué"

INDEX="artifacts/drimpay/dist/public/index.html"
if [ ! -f "$INDEX" ]; then
  error "index.html introuvable après build : $INDEX"
fi
DIST_SIZE=$(du -sh "artifacts/drimpay/dist/public" | cut -f1)
ok "Frontend compilé — $DIST_SIZE  →  artifacts/drimpay/dist/public/"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  ✓ Build terminé avec succès — $(date '+%H:%M:%S')${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Prochaine étape → ${BOLD}git push origin main${NC}"
echo -e "  Sur Plesk       → ${BOLD}git pull origin main${NC} + restart"
echo ""
