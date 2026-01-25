from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, BigInteger
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncAttrs

class Base(AsyncAttrs, DeclarativeBase):
    """Базовый класс для всех моделей с поддержкой асинхронности"""
    pass

class User(Base):
    """Модель пользователя"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    subscription_status: Mapped[bool] = mapped_column(default=False)  # Статус подписки

class RateLimitEntry(Base):
    """Модель для отслеживания rate limit"""
    __tablename__ = "rate_limit_entries"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

class SparringProfile(Base):
    """Модель спарринг-профиля (зеркало таблицы Supabase)"""
    __tablename__ = "sparring_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # uuid
    telegram_user_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    weight_kg: Mapped[int | None] = mapped_column(Integer, nullable=True)
    experience_years: Mapped[float | None] = mapped_column(Integer, nullable=True)
    style: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
