#!/bin/sh

mkdir -p /app/data

export HOSTNAME=0.0.0.0
export PORT=${PORT:-8080}
export DATABASE_URL="${DATABASE_URL:-file:./data/dev.db}"

echo "=== Startup ==="
echo "PORT=${PORT}"
echo "DATABASE_URL=${DATABASE_URL}"

echo "Running migrations..."
npx prisma migrate deploy

if [ ! -f /app/data/.seeded ]; then
  echo "Seeding database..."
  npx prisma db seed || true
  touch /app/data/.seeded
fi

echo "Starting Next.js on 0.0.0.0:${PORT}"
exec node ./node_modules/next/dist/bin/next start -H 0.0.0.0 -p "${PORT}"
