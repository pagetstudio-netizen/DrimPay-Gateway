#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# DrimPay — Déploiement Plesk
#
# Prérequis : avoir buildé + pushé depuis Replit (bash scripts/build.sh)
# Les fichiers compilés (dist/) sont dans git — aucun build ici.
#
# Usage :
#   bash scripts/deploy-plesk.sh
#
# Ou manuellement :
#   git pull origin main
#   touch tmp/restart.txt
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
log()   { echo -e "${BLUE}[deploy]${NC} $1"; }
ok()    { echo -e "${GREEN}[ok]${NC} $1"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $1"; }
error() { echo -e "${RED}[erreur]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${BLUE}   DrimPay — Déploiement Plesk — $(date '+%d/%m/%Y %H:%M:%S')${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 1. Vérification env vars critiques ───────────────────────────────────────
log "Vérification des variables d'environnement..."
MISSING=()
for VAR in SUPABASE_DATABASE_URL SESSION_SECRET SUPABASE_SERVICE_ROLE_KEY; do
  [ -z "${!VAR:-}" ] && MISSING+=("$VAR")
done
if [ ${#MISSING[@]} -gt 0 ]; then
  warn "Variables manquantes : ${MISSING[*]}"
  warn "→ Plesk > Node.js App > Environment Variables"
else
  ok "Variables d'environnement OK"
fi

# ── 2. Git pull ───────────────────────────────────────────────────────────────
log "Récupération du code depuis GitHub..."
git pull origin main || error "git pull échoué — vérifiez les droits GitHub"
COMMIT=$(git rev-parse --short HEAD)
ok "Code à jour — commit : $COMMIT"

# ── 3. Vérification des fichiers compilés ────────────────────────────────────
log "Vérification des bundles..."

BUNDLE="artifacts/api-server/dist/index.mjs"
INDEX="artifacts/drimpay/dist/public/index.html"

[ ! -f "$BUNDLE" ] && error "Bundle API introuvable : $BUNDLE — avez-vous buildé sur Replit avant de pusher ?"
[ ! -f "$INDEX" ]  && error "Frontend introuvable : $INDEX — avez-vous buildé sur Replit avant de pusher ?"
[ ! -f "start.cjs" ] && error "start.cjs introuvable"

ok "Bundles présents ✓"

# ── 4. Restart Passenger ──────────────────────────────────────────────────────
log "Redémarrage du serveur Node.js (Passenger)..."
mkdir -p tmp
touch tmp/restart.txt
ok "Signal de redémarrage envoyé"

# ── 5. Health check ───────────────────────────────────────────────────────────
log "Attente du démarrage..."
sleep 6
APP_PORT="${PORT:-8080}"
ATTEMPT=0
until curl -sf "http://localhost:${APP_PORT}/" >/dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  [ $ATTEMPT -ge 15 ] && { warn "Timeout après $((ATTEMPT * 2))s — vérifiez les logs Passenger"; break; }
  sleep 2
done

if curl -sf "http://localhost:${APP_PORT}/" >/dev/null 2>&1; then
  ok "Application en ligne ✓"
fi

echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  ✓ Déploiement terminé — $(date '+%H:%M:%S')${NC}"
echo -e "${BOLD}${GREEN}  commit : $COMMIT${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
