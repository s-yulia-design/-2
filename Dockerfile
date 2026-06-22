FROM node:22-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Сначала зависимости и схема БД (без postinstall)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts
RUN npx prisma generate

# Весь код проекта
COPY . .

ENV DATABASE_URL="file:/data/dev.db"
RUN npm run build

RUN mkdir -p /data
RUN chmod +x scripts/start.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "scripts/start.sh"]
