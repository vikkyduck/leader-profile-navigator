#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Leader Profile Navigator — деплой статики на Timeweb VDS.
# Запуск с локальной машины:  ./deploy.sh
# Сборка локальная (vite build), на сервер уезжает только dist/.
# Nginx на сервере: /etc/nginx/sites-available/leader-navigator (порт 8090).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SERVER="${SERVER_USER:-root}@${SERVER_HOST:-5.129.198.180}"
REMOTE_DIR="/opt/leader-navigator/dist"

echo "==> [1/3] Сборка"
npm run build

echo "==> [2/3] Заливка dist/ на $SERVER:$REMOTE_DIR"
rsync -az --delete dist/ "$SERVER:$REMOTE_DIR/"

echo "==> [3/3] Проверка"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "http://${SERVER_HOST:-5.129.198.180}:8090/"

echo "✅ Готово: http://${SERVER_HOST:-5.129.198.180}:8090/"
