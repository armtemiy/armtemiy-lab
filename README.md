# Armtemiy Lab

Telegram Mini App (TMA) для тактической диагностики поражений в армрестлинге и поиска спарринг-партнеров.

## Модули

*   **Диагностика поражения:** Экспертная система для анализа ошибок.
*   **Поиск спарринг-партнеров:** Карта армрестлеров с фильтрами и анкетами.
*   **Антропометрия:** Калькулятор для определения предрасположенности к стилям.
*   **Контр-матрица:** Быстрая справка "что бьет что".

## Ссылки

*   [Бот в Telegram](https://t.me/armtemiy_lab_bot) (Dev)
*   [Web App](https://armtemiy.github.io/armtemiy-lab/)

## Установка и запуск

### Frontend (Vite + React)

1.  Скопируйте `.env.example` в `.env` и заполните ключи Supabase.
2.  `npm install`
3.  `npm run dev`

### Бот (Python + Aiogram)

1.  `cd bot`
2.  `python -m venv .venv`
3.  `.venv/Scripts/activate`
4.  `pip install -r requirements.txt`
5.  Создайте `bot/.env` (см. `bot/.env.example`).
6.  `python main.py`

## Документация

*   [Модуль Спарринга](docs/SPARRING.md)
*   [Админ-панель Web](docs/ADMIN.md)
*   [Антропометрия](docs/ANTHRO.md)

## Команды бота

*   `/start` - Главное меню
*   `/profile` - Профиль пользователя (статистика + спарринг)
*   `/admin` - Панель администратора (только для админов)
*   `/info` - Информация о проекте
