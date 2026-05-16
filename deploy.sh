#!/usr/bin/env bash
set -e

echo "=== DrimPay Deploy $(date) ==="

STARTUP_FILE="artifacts/api-server/dist/index.mjs"
FRONTEND_FILE="artifacts/drimpay/dist/public/index.html"

if [ ! -f "$STARTUP_FILE" ]; then
  echo "ERREUR: $STARTUP_FILE introuvable."
  exit 1
fi

if [ ! -f "$FRONTEND_FILE" ]; then
  echo "ERREUR: $FRONTEND_FILE introuvable."
  exit 1
fi

echo "OK: $STARTUP_FILE"
echo "OK: $FRONTEND_FILE"

mkdir -p tmp
touch tmp/restart.txt

echo "Redemarrage Passenger declenche."
echo "=== Deploiement termine ==="
