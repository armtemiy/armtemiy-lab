import os
import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from bot.db.models import Base

# Получаем URL БД из переменных окружения
DATABASE_URL = os.getenv("DATABASE_URL")

# Убираем ?ssl=require из URL если есть (будем передавать через connect_args)
if DATABASE_URL and "?" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?")[0]

# Настройка SSL для asyncpg
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Определяем connect_args в зависимости от типа БД
if DATABASE_URL and "postgresql" in DATABASE_URL:
    connect_args = {
        "ssl": ssl_context,
        "timeout": 60,  # Увеличенный таймаут
        "command_timeout": 60,
    }
else:
    connect_args = {}

# Используем NullPool для Supabase Pooler - он сам управляет пулом
# Это решает проблему "connection was closed in the middle of operation"
engine = create_async_engine(
    DATABASE_URL if DATABASE_URL else "sqlite+aiosqlite:///bot.db",
    echo=False,
    connect_args=connect_args,
    poolclass=NullPool,  # Отключаем пул SQLAlchemy, используем пул Supabase
    pool_pre_ping=True,  # Проверяем соединение перед использованием (SELECT 1)
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def init_db():
    """Создает таблицы, если их нет"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        return True
    except Exception as e:
        print(f"Database init error: {e}")
        return False

async def get_db_session() -> AsyncSession:
    """Генератор сессий"""
    async with AsyncSessionLocal() as session:
        yield session

def get_session() -> AsyncSession:
    """Создать новую сессию (не генератор)"""
    return AsyncSessionLocal()
