#!/bin/sh
set -e

mkdir -p /data

# Railway сам задаёт PORT — не фиксируем 3000
export HOSTNAME=0.0.0.0
export PORT=${PORT:-3000}

echo "Applying database migrations..."
npx prisma migrate deploy

if [ ! -f /data/.seeded ]; then
  echo "Seeding demo data..."
  npx prisma db seed || echo "Seed skipped (database may already have data)"
  touch /data/.seeded 2>/dev/null || true
fi

echo "Starting Next.js on 0.0.0.0:${PORT}"
exec npx next start -H 0.0.0.0 -p "${PORT}"
