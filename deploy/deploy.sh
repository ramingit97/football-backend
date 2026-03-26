#!/bin/bash
set -e

# Запускать из папки deploy/
# cd deploy && ./deploy.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$BACKEND_DIR")"

echo "=== Football Platform Deploy ==="

# 1. Сборка фронтенда
echo "[1/3] Building frontend..."
cd "$ROOT_DIR/user-app"
npm ci
VITE_API_BASE="" npm run build

# 2. Копируем сборку в Docker volume
echo "[2/3] Copying frontend build to Docker volume..."
docker run --rm \
  -v "$ROOT_DIR/user-app/dist:/src" \
  -v "deploy_frontend_build:/dst" \
  alpine sh -c "rm -rf /dst/* && cp -r /src/. /dst/"

# 3. Запускаем контейнеры
echo "[3/3] Starting containers..."
cd "$SCRIPT_DIR"
docker compose up -d --build backend frontend postgres minio

echo ""
echo "=== Done! ==="
echo "App:         http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "MinIO panel: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP'):9001"
