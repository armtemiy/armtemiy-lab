# Armtemiy Lab

Telegram Mini App (TMA) для тактической диагностики поражений в армрестлинге.

## Запуск локально

1. Скопируй `.env.example` в `.env` и заполни значения.
2. Установи зависимости:

```
npm install
```

3. Запусти проект:

```
npm run dev
```

## Переменные окружения

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_IDS` (через запятую)

## Деплой на GitHub Pages

В репозитории настроен GitHub Actions workflow.
После пуша в `main` автоматически соберется и задеплоится Pages.

## Важно

Никогда не коммить секретные ключи или токен бота.
