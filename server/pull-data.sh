#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Забрать все ответы с сервера к себе на компьютер.
# Запуск:  ./server/pull-data.sh [каталог]
# По умолчанию складывает в ~/Documents/Радары-данные/<дата>/
#
# Кладёт две вещи:
#   radars.db  — сам файл базы (открывается любым просмотрщиком SQLite)
#   export.json — те же ответы в JSON, если удобнее читать глазами
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SERVER="${SERVER_USER:-root}@${SERVER_HOST:-5.129.198.180}"
TARGET="${1:-$HOME/Documents/Радары-данные/$(date +%Y-%m-%d)}"

mkdir -p "$TARGET"

echo "==> [1/2] Копирую базу"
rsync -az "$SERVER:/opt/radars-api/data/radars.db" "$TARGET/radars.db"

echo "==> [2/2] Собираю JSON-выгрузку"
KEY=$(ssh "$SERVER" 'grep ^ADMIN_KEY= /opt/radars-api/radars-api.env | cut -d= -f2')
ssh "$SERVER" "curl -s 'http://127.0.0.1:5040/api/export?key=$KEY'" > "$TARGET/export.json"

echo "✅ Готово: $TARGET"
ls -lh "$TARGET"
