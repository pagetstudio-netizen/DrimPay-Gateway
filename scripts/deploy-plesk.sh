#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# DrimPay — Déploiement Plesk
#
# Workflow recommandé :
#   1. Sur Replit : faire les modifications + build + push GitHub
#   2. Sur Plesk  : bash scripts/deploy-plesk.sh
#
# Ce script fait : git pull → pnpm install → db push → restart Passenger
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()   { echo -e "${BLUE}[deploy]${NC} $1"; }
ok()    { echo -e "${GREEN}[ok]${NC} $1"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $1"; }
error() { echo -e "${RED}[error]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   DrimPay — Déploiement Plesk — $(date '+%d/%m/%Y %H:%M:%S')${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 1. Vérification env vars critiques ───────────────────────────────────────
log "Vérification des variables d'environnement..."

MISSING=()
for VAR in SUPABASE_DATABASE_URL SESSION_SECRET; do
  if [ -z "${!VAR:-}" ]; then
    MISSING+=("$VAR")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  warn "Variables manquantes dans l'environnement Plesk : ${MISSING[*]}"
  warn "→ Plesk > Node.js > Environment Variables"
  warn "L'application peut ne pas fonctionner correctement sans ces variables."
else
  ok "Variables d'environnement OK"
fi

# ── 2. Git pull ───────────────────────────────────────────────────────────────
log "Récupération du code depuis GitHub..."
git pull origin main || error "git pull échoué — vérifiez les droits GitHub"
ok "Code à jour — commit : $(git rev-parse --short HEAD)"

# ── 3. Dépendances ────────────────────────────────────────────────────────────
log "Installation des dépendances..."
pnpm install --frozen-lockfile || error "pnpm install échoué"
ok "Dépendances installées"

# ── 4. Schéma DB ──────────────────────────────────────────────────────────────
log "Synchronisation du schéma de base de données..."
pnpm --filter @workspace/db run push && ok "Schéma DB à jour" || warn "DB push échoué — les tables existent peut-être déjà"

# ── 4b. Vérification du startup file ──────────────────────────────────────────
if [ ! -f "start.cjs" ]; then
  error "start.cjs introuvable — vérifiez que le git pull est complet"
fi
ok "start.cjs présent"

# ── 5. Restart Passenger ──────────────────────────────────────────────────────
log "Redémarrage du serveur Node.js (Passenger)..."
mkdir -p tmp
touch tmp/restart.txt
ok "Signal de redémarrage envoyé"

# ── 6. Health check ───────────────────────────────────────────────────────────
log "Vérification que l'application répond..."
sleep 5
APP_PORT="${PORT:-8080}"
ATTEMPT=0
until curl -sf "http://localhost:${APP_PORT}/health" >/dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -ge 20 ]; then
    warn "Health check timeout après $((ATTEMPT * 2))s — vérifiez les logs Passenger"
    break
  fi
  sleep 2
done

if curl -sf "http://localhost:${APP_PORT}/health" >/dev/null 2>&1; then
  ok "Application en ligne ✓"
  HEALTH=$(curl -s "http://localhost:${APP_PORT}/health")
  echo "   $HEALTH"
fi

echo ""
echo -e "${GREEN}  ✓ Déploiement terminé — $(date '+%H:%M:%S')${NC}"
echo ""
