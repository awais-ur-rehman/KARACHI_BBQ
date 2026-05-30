#!/bin/sh
# Karachi B.B.Q POS — backup script (Phase 0 stub).
# Phase 7 fills in the scheduled invocation reading Settings.backup_cron from
# the database. For now this is a manual one-shot:
#   docker compose exec backup /backup.sh
set -eu

STAMP=$(date -u +'%Y%m%d-%H%M%S')
OUT="${BACKUP_DIR}/kbbq-${STAMP}.dump"

echo "Backing up to ${OUT}…"
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  --host=db \
  --username="${POSTGRES_USER}" \
  --dbname="${POSTGRES_DB}" \
  --format=custom \
  --file="${OUT}"
echo "OK: ${OUT}"
