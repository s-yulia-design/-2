#!/bin/sh

mkdir -p /data

export HOSTNAME=0.0.0.0
export PORT=${PORT:-8080}
export DATABASE_URL="file:/data/dev.db"

echo "=== Provider Dashboard startup ==="
echo "PORT=${PORT}"

# Первый запуск: копируем готовую базу с демо-данными
if [ ! -f /data/dev.db ] && [ -f /app/db-template/dev.db ]; then
  echo "Copying pre-seeded database to /data/dev.db"
  cp /app/db-template/dev.db /data/dev.db
fi

echo "Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "Migration failed!"
  exit 1
fi

echo "Starting Next.js on 0.0.0.0:${PORT}"
exec node ./node_modules/next/dist/bin/next start -H 0.0.0.0 -p "${PORT}"
