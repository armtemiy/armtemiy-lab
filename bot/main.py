import asyncio
import sys
from aiogram import Bot, Dispatcher
from loguru import logger

from bot.config import BOT_TOKEN
from bot.db.database import init_db
from bot.middlewares.spam_protection import SpamProtectionMiddleware
from bot.handlers import start, menu, admin

# Настройка логирования
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add("logs/bot.log", rotation="10 MB", level="DEBUG")

async def main() -> None:
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN is missing!")
        return

    # Инициализация БД
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()

    # Middleware
    dp.update.middleware(SpamProtectionMiddleware())

    # Роутеры
    dp.include_router(start.router)
    dp.include_router(menu.router)
    dp.include_router(admin.router)

    logger.info("Bot started polling...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
