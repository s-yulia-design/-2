FROM node:22-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts
RUN npx prisma generate

COPY . .

RUN npm run build

# Демо-база создаётся при сборке, не при каждом запуске
ENV DATABASE_URL="file:/app/db-template/dev.db"
RUN mkdir -p /app/db-template \
  && npx prisma migrate deploy \
  && npx prisma db seed

RUN mkdir -p /data
RUN sed -i 's/\r$//' scripts/start.sh && chmod +x scripts/start.sh

EXPOSE 8080
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "scripts/start.sh"]
