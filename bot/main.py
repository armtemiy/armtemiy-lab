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

# Флаг доступности БД
db_available = False

async def main() -> None:
    global db_available
    
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN is missing!")
        return

    # Инициализация БД (не критично если не работает)
    try:
        result = await init_db()
        if result:
            db_available = True
            logger.info("Database initialized successfully")
        else:
            logger.warning("Database initialization returned False, continuing without DB")
    except Exception as e:
        logger.warning(f"Database not available, continuing without DB: {e}")

    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()

    # Middleware (будет работать даже без БД благодаря обработке ошибок)
    dp.update.middleware(SpamProtectionMiddleware())

    # Роутеры
    dp.include_router(start.router)
    dp.include_router(menu.router)
    dp.include_router(admin.router)

    logger.info(f"Bot started polling... (DB: {'connected' if db_available else 'offline'})")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
