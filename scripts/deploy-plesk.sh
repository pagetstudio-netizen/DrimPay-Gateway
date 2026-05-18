#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# DrimPay — Déploiement Plesk (simple)
#
# Usage depuis le serveur Plesk :
#   bash scripts/deploy-plesk.sh
#
# Le build est déjà compilé sur Replit avant le push GitHub.
# Ce script fait uniquement : git pull → restart Passenger.
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
log()   { echo -e "${BLUE}[deploy]${NC} $1"; }
ok()    { echo -e "${GREEN}[ok]${NC} $1"; }
error() { echo -e "${RED}[error]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# ── 1. Git pull ───────────────────────────────────────────────────────────────
log "git pull..."
git pull origin main || error "git pull échoué"
ok "Code à jour — commit : $(git rev-parse --short HEAD)"

# ── 2. Restart Passenger ──────────────────────────────────────────────────────
log "Redémarrage Passenger..."
mkdir -p tmp
touch tmp/restart.txt
ok "Signal envoyé (tmp/restart.txt)"

# ── 3. Health check ──────────────────────────────────────────────────────────
sleep 4
APP_PORT="${PORT:-8080}"
ATTEMPT=0
until curl -sf "http://localhost:${APP_PORT}/health" >/dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  [ $ATTEMPT -ge 15 ] && { log "Health check timeout — vérifiez les logs Passenger"; break; }
  sleep 2
done

if curl -sf "http://localhost:${APP_PORT}/health" >/dev/null 2>&1; then
  ok "Application en ligne ✓"
fi

echo ""
echo -e "${GREEN}  Déploiement terminé — $(date '+%H:%M:%S')${NC}"
echo ""
