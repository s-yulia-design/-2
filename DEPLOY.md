# Публикация в интернет (Railway + SQLite)

## Быстрая проверка: какая версия на сайте

Внизу страницы должно быть:

**Версия: 2.1 · сборка xxxxxxx**

Если внизу нет этой строки — Railway всё ещё показывает **старую** сборку (Ерзовка, Городище, Романовка).

---

## Почему Redeploy не помогает

**Redeploy** перезапускает **тот же старый коммит**, а не забирает код с GitHub.

Нужен **новый деплой** с ветки `main` (см. ниже).

---

## Шаг 1. Настройки Railway (один раз)

1. Сервис → **Settings → Source**
   - Репозиторий: `s-yulia-design/-2`
   - Ветка: **main**
2. **Settings → Build**
   - Builder: **Nixpacks** (не Dockerfile)
3. **Settings → Variables**
   - `DATABASE_URL` = `file:/data/dev.db`
4. **Volume**: mount path `/data`
5. **Networking** → домен (ссылка для менеджера)

---

## Шаг 2. Deploy Hook (чтобы обновления доходили автоматически)

1. Railway → сервис → **Settings → Webhooks** → **Create Webhook** → скопируйте URL
2. GitHub → репозиторий `-2` → **Settings → Secrets and variables → Actions**
3. **New repository secret**: имя `RAILWAY_DEPLOY_HOOK`, значение — URL из п.1
4. После каждого `git push` GitHub сам вызовет деплой на Railway

Без секрета можно вручную: вставить URL webhook в браузер (POST) или в Railway нажать **Deploy** у последнего коммита (не Redeploy).

---

## Шаг 3. Загрузить код на GitHub

```bash
git add .
git commit -m "описание изменений"
git push origin main
```

---

## Локальный запуск (у себя)

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Открыть: http://localhost:3000

---

## Если сборка падает

Убедитесь, что в репозитории есть:
- `package-lock.json`
- `prisma/schema.prisma`
- `prisma/migrations/` (вся папка)
- `railway.json` и `nixpacks.toml` (сборка через Nixpacks)

## Если статус CRASHED

1. Volume `/data` и `DATABASE_URL=file:/data/dev.db`
2. **Restart** (не Redeploy старого деплоя)
