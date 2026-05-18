#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# DrimPay — Script de déploiement Plesk
# Usage : bash scripts/deploy-plesk.sh [--skip-pull] [--skip-db]
#
# Ce script s'exécute depuis la racine du projet sur le serveur Plesk.
# Il tire le dernier code, installe les dépendances, applique les migrations,
# compile le frontend + backend, puis redémarre Passenger.
#
# Variables d'environnement requises sur Plesk :
#   SUPABASE_DATABASE_URL  — connexion PostgreSQL Supabase
#   SESSION_SECRET         — clé secrète pour les sessions
#   NODE_ENV=production
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Couleurs ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${BLUE}[deploy]${NC} $1"; }
ok()    { echo -e "${GREEN}[ok]${NC} $1"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $1"; }
error() { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ── Options ───────────────────────────────────────────────────────────────────
SKIP_PULL=false
SKIP_DB=false
for arg in "$@"; do
  case $arg in
    --skip-pull) SKIP_PULL=true ;;
    --skip-db)   SKIP_DB=true ;;
  esac
done

# ── Répertoire racine du projet ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"
log "Répertoire : $ROOT_DIR"

# ── Vérifications préalables ─────────────────────────────────────────────────
command -v node  >/dev/null 2>&1 || error "node n'est pas installé"
command -v pnpm  >/dev/null 2>&1 || error "pnpm n'est pas installé (npm install -g pnpm)"

if [ -z "${SUPABASE_DATABASE_URL:-}" ] && [ -z "${DATABASE_URL:-}" ]; then
  error "SUPABASE_DATABASE_URL ou DATABASE_URL doit être défini"
fi

# ── 1. Git pull ───────────────────────────────────────────────────────────────
if [ "$SKIP_PULL" = false ]; then
  log "Récupération du dernier code (git pull)..."
  git pull origin main || error "git pull échoué"
  ok "Code à jour"
else
  warn "git pull ignoré (--skip-pull)"
fi

# ── 2. Dépendances ───────────────────────────────────────────────────────────
log "Installation des dépendances..."
pnpm install --frozen-lockfile || error "pnpm install échoué"
ok "Dépendances installées"

# ── 3. Migration base de données ─────────────────────────────────────────────
if [ "$SKIP_DB" = false ]; then
  log "Application des migrations DB..."
  pnpm --filter @workspace/db run push || error "Migration DB échouée"
  ok "Schema DB à jour"
else
  warn "Migration DB ignorée (--skip-db)"
fi

# ── 4. Build production ───────────────────────────────────────────────────────
log "Compilation frontend + backend..."
pnpm run build:prod || error "Build échoué"
ok "Build terminé"

# ── 5. Redémarrage Passenger ──────────────────────────────────────────────────
log "Redémarrage de l'application (Passenger)..."

# Passenger redémarre quand tmp/restart.txt est modifié
mkdir -p "$ROOT_DIR/tmp"
touch "$ROOT_DIR/tmp/restart.txt"
ok "Signal de redémarrage envoyé à Passenger"

# Délai pour laisser Passenger démarrer le nouveau processus
sleep 3

# ── 6. Vérification santé ────────────────────────────────────────────────────
log "Vérification santé de l'application..."

# Détecte le port (défaut 8080 pour Plesk)
APP_PORT="${PORT:-8080}"
HEALTH_URL="http://localhost:${APP_PORT}/health"

MAX_ATTEMPTS=10
ATTEMPT=0
until curl -sf "$HEALTH_URL" >/dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    warn "L'application ne répond pas sur $HEALTH_URL après ${MAX_ATTEMPTS}s"
    warn "Vérifiez les logs Passenger pour les erreurs"
    break
  fi
  log "En attente... ($ATTEMPT/${MAX_ATTEMPTS})"
  sleep 2
done

if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
  HEALTH=$(curl -s "$HEALTH_URL")
  ok "Application en ligne : $HEALTH"
else
  warn "Le health check n'a pas répondu — l'application démarre peut-être encore"
fi

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Déploiement terminé avec succès${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Commit : $(git rev-parse --short HEAD 2>/dev/null || echo 'inconnu')"
echo "  Heure  : $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""
echo "  Options utiles :"
echo "    --skip-pull   Ignorer git pull (code déjà à jour)"
echo "    --skip-db     Ignorer les migrations DB"
echo ""
