# Публикация в интернет (Railway + SQLite)

## Что нужно один раз

1. Аккаунт на [GitHub](https://github.com) (у вас уже есть)
2. Аккаунт на [Railway](https://railway.app) — войти через GitHub

## Шаг 1. Загрузить код на GitHub

В папке проекта в терминале:

```bash
git init
git add .
git commit -m "Пробный дашборд для менеджера"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/provider-dashboard.git
git push -u origin main
```

Создайте пустой репозиторий `provider-dashboard` на GitHub заранее.

## Шаг 2. Развернуть на Railway

1. Откройте [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → выберите `provider-dashboard`
3. Railway соберёт проект по `Dockerfile`
4. В настройках сервиса добавьте **Volume**:
   - Mount path: `/data`
5. Переменная окружения:
   - `DATABASE_URL` = `file:/data/dev.db`
6. В разделе **Settings → Networking** нажмите **Generate Domain**
7. Скопируйте ссылку вида `https://....up.railway.app`

## Шаг 3. Отправить менеджеру

Менеджеру нужна **только ссылка Railway**, не GitHub.

Открывает в браузере — ничего устанавливать не нужно.

## Локальный запуск (у себя)

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Открыть: http://localhost:3000

## Если сборка падает на npm ci

Убедитесь, что в GitHub есть файлы:
- `package-lock.json`
- `prisma/schema.prisma`
- `prisma/migrations/` (вся папка)

## Если статус CRASHED (сборка прошла, сайт не стартует)

1. Добавьте Volume с путём `/data`
2. Добавьте переменную `DATABASE_URL` = `file:/data/dev.db`
3. Нажмите **Restart** на Railway

