import asyncio
import os

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import KeyboardButton, Message, ReplyKeyboardMarkup


BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://armtemiy.github.io/armtemiy-lab/")


def build_main_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="Профиль"),
                KeyboardButton(text="Инфо"),
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
        selective=False,
    )


async def start_handler(message: Message) -> None:
    user = message.from_user
    name = user.first_name if user else "там"
    text = (
        f"Привет, {name}. Я Armtemiy Lab — тактический бот для армрестлинга.\n"
        "Помогаю быстро разобрать поражение и понять, что делать дальше.\n"
        f"Мини-приложение: {WEBAPP_URL}"
    )
    await message.answer(text, reply_markup=build_main_keyboard())


async def profile_handler(message: Message) -> None:
    user = message.from_user
    if not user:
        await message.answer("Не вижу данные профиля.")
        return

    username_line = f"Username: @{user.username}" if user.username else "Username: -"
    profile = (
        "Профиль\n"
        f"ID: {user.id}\n"
        f"Имя: {user.first_name or '-'}\n"
        f"{username_line}"
    )
    await message.answer(profile)


async def info_handler(message: Message) -> None:
    text = (
        "Инфо\n"
        "1) Диагностика поражения за 60 секунд.\n"
        "2) Антропометрия и контр-матрица.\n"
        f"Открой мини-приложение: {WEBAPP_URL}"
    )
    await message.answer(text)


async def fallback_handler(message: Message) -> None:
    await message.answer("Используй кнопки: Профиль или Инфо.")


async def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is missing")

    bot = Bot(BOT_TOKEN)
    dp = Dispatcher()

    dp.message.register(start_handler, CommandStart())
    dp.message.register(profile_handler, F.text == "Профиль")
    dp.message.register(info_handler, F.text == "Инфо")
    dp.message.register(fallback_handler)

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
