# Armtemiy Lab

Telegram Mini App (TMA) для тактической диагностики поражений в армрестлинге.

## Модули

- Диагностика поражения (основной).
- Антропометрия (черновой калькулятор стиля).
- Контр-матрица (верх > крюк, крюк > пресс, пресс > верх).
- Админ: загрузка/экспорт JSON дерева (локально, через `localStorage`).

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
- `VITE_BOT_USERNAME` (username бота для открытия WebApp)

## Шаблон дерева логики

Готовый шаблон JSON находится в `assets/diagnostic-template.json`.
Его можно загрузить через админ-модуль или использовать как основу.

## Supabase

- Схема: `supabase/schema.sql`
- Миграция: `supabase/migrations/*.sql`
- Таблица результатов: `diagnostic_results`

## Документация

- `docs/ADMIN.md` — админ-модуль и загрузка JSON
- `docs/ANTHRO.md` — логика антропометрии

## Деплой на GitHub Pages

В репозитории настроен GitHub Actions workflow.
После пуша в `main` автоматически соберется и задеплоится Pages.

## Бот (aiogram)

Папка: `bot/`

Запуск локально:

```
python -m venv bot/.venv
bot/.venv/Scripts/pip install -r bot/requirements.txt
copy bot/.env.example bot/.env
bot/.venv/Scripts/python bot/main.py
```

Переменные:

- `BOT_TOKEN`
- `WEBAPP_URL`

## Важно

Никогда не коммить секретные ключи или токен бота.
