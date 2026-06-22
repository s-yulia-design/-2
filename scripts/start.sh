#!/bin/sh
set -e

mkdir -p /data

echo "Applying database migrations..."
npx prisma migrate deploy

if [ ! -f /data/.seeded ]; then
  echo "Seeding demo data..."
  npx prisma db seed
  touch /data/.seeded
fi

echo "Starting application..."
npm start
