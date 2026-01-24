# Supabase setup

## 1) Схема таблиц

В Supabase SQL Editor выполни содержимое `supabase/schema.sql`.

## 2) Edge Function

Функция находится в `supabase/functions/create-stars-invoice/index.ts`.

Перед деплоем добавь секреты в Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_PROVIDER_TOKEN` (опционально)

### Деплой через CLI

```
supabase functions deploy create-stars-invoice
```

### Локальный запуск

```
supabase functions serve create-stars-invoice --no-verify-jwt
```

## 3) Переменные окружения фронта

В `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_IDS`

## Примечания

- В MVP RLS выключен, чтобы ускорить запуск.
- Позже можно включить RLS и перейти на полноценную авторизацию.
