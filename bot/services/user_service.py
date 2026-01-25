import os
from dataclasses import dataclass
from datetime import datetime
from time import time
from typing import Dict, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.exc import DBAPIError

from bot.db.database import AsyncSessionLocal
from bot.db.models import User, SparringProfile

USER_CACHE_TTL = int(os.getenv("USER_CACHE_TTL", "300"))


@dataclass(frozen=True)
class UserSnapshot:
    telegram_id: int
    username: str | None
    first_name: str | None
    created_at: datetime
    subscription_status: bool
    sparring_stats: str | None = None  # Строка с кратким инфо о спарринге


_user_cache: Dict[int, Tuple[float, UserSnapshot]] = {}


def _get_cached_user(telegram_id: int) -> UserSnapshot | None:
    cached = _user_cache.get(telegram_id)
    if not cached:
        return None
    timestamp, snapshot = cached
    if time() - timestamp > USER_CACHE_TTL:
        _user_cache.pop(telegram_id, None)
        return None
    return snapshot


def _set_cached_user(snapshot: UserSnapshot) -> None:
    _user_cache[snapshot.telegram_id] = (time(), snapshot)


def _make_snapshot(user: User, sparring_info: str | None = None) -> UserSnapshot:
    return UserSnapshot(
        telegram_id=user.telegram_id,
        username=user.username,
        first_name=user.first_name,
        created_at=user.created_at,
        subscription_status=user.subscription_status,
        sparring_stats=sparring_info
    )


async def get_user_snapshot(telegram_id: int) -> UserSnapshot | None:
    cached = _get_cached_user(telegram_id)
    if cached:
        return cached

    try:
        async with AsyncSessionLocal() as session:
            # Получаем пользователя
            result = await session.execute(select(User).where(User.telegram_id == telegram_id))
            user = result.scalar_one_or_none()
            if not user:
                return None

            # Получаем спарринг профиль
            sparring_result = await session.execute(
                select(SparringProfile).where(SparringProfile.telegram_user_id == str(telegram_id))
            )
            sparring = sparring_result.scalar_one_or_none()
            
            sparring_info = None
            if sparring and sparring.is_active:
                style_map = {"outside": "Аутсайд", "inside": "Инсайд", "both": "Универсал"}
                style_name = style_map.get(sparring.style, sparring.style)
                sparring_info = f"{style_name}, {sparring.weight_kg}кг, стаж {sparring.experience_years}г"

            snapshot = _make_snapshot(user, sparring_info)
            _set_cached_user(snapshot)
            return snapshot
    except (DBAPIError, OSError, Exception) as e:
        print(f"user_service snapshot error: {e}")
        return cached


async def get_or_create_user(telegram_id: int, username: str | None = None, first_name: str | None = None) -> User | None:
    """
    Получить или создать пользователя.
    Возвращает None если БД недоступна.
    """
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.telegram_id == telegram_id))
            user = result.scalar_one_or_none()

            if user:
                if user.username != username or user.first_name != first_name:
                    user.username = username
                    user.first_name = first_name
                    await session.commit()
                # Не обновляем кэш тут, так как нет данных о спарринге
                return user

            new_user = User(
                telegram_id=telegram_id,
                username=username,
                first_name=first_name,
                subscription_status=False,
            )
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)
            # Не кэшируем тут, чтобы при следующем запросе подтянулся и спарринг профиль (если есть)
            return new_user
    except (DBAPIError, OSError, Exception) as e:
        print(f"user_service error: {e}")
        return None
