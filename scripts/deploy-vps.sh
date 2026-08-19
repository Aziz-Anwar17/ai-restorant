#!/usr/bin/env bash
# Deploy AI Restorant (full processing stack) to a fresh Ubuntu/Debian VPS.
# Usage: ./scripts/deploy-vps.sh root@YOUR_VPS_IP
set -euo pipefail

HOST="${1:?Usage: deploy-vps.sh user@vps-ip [domain]}"
DOMAIN="${2:-${DOMAIN:-asianorestaurant.co.uk}}"
REPO="https://github.com/Aziz-Anwar17/ai-restorant.git"
DIR=/opt/ai-restorant

if [ ! -f .env.production ]; then
  echo "✗ .env.production not found — copy .env.production.example and fill it in first."
  exit 1
fi

echo "→ Installing Docker on $HOST (idempotent)…"
ssh "$HOST" 'command -v docker >/dev/null || (curl -fsSL https://get.docker.com | sh)'

echo "→ Syncing repository…"
ssh "$HOST" "command -v git >/dev/null || (apt-get update -qq && apt-get install -y -qq git); \
  if [ -d $DIR/.git ]; then cd $DIR && git fetch origin main && git reset --hard origin/main; \
  else git clone $REPO $DIR; fi"

echo "→ Uploading secrets (.env.production)…"
scp -q .env.production "$HOST:$DIR/.env.production"

echo "→ Writing Caddyfile for $DOMAIN…"
ssh "$HOST" "cd $DIR && sed 's/YOUR_DOMAIN\\.com/$DOMAIN/g' Caddyfile > Caddyfile.deployed && mv Caddyfile.deployed Caddyfile"

echo "→ Building and starting containers (first build takes ~10 min)…"
ssh "$HOST" "cd $DIR && docker compose --env-file .env.production up -d --build"

echo "→ Waiting for health…"
ssh "$HOST" 'for i in $(seq 1 30); do
  if docker exec $(docker ps -qf name=app) curl -fs http://localhost:3789/api/health 2>/dev/null | grep -q "\"ready\":true"; then
    echo "✓ Pipeline healthy"; exit 0; fi; sleep 10; done; echo "✗ Health check timed out"; exit 1'

echo
echo "✓ Deployed. Point DNS A records for YOUR_DOMAIN.com (and www) to this VPS's IP."
echo "  Caddy will obtain SSL certificates automatically once DNS resolves."
