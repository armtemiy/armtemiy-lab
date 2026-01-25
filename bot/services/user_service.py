import os
from dataclasses import dataclass
from datetime import datetime
from time import time
from typing import Dict, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.exc import DBAPIError

from bot.db.database import AsyncSessionLocal
from bot.db.models import User

USER_CACHE_TTL = int(os.getenv("USER_CACHE_TTL", "300"))


@dataclass(frozen=True)
class UserSnapshot:
    telegram_id: int
    username: str | None
    first_name: str | None
    created_at: datetime
    subscription_status: bool


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


def _make_snapshot(user: User) -> UserSnapshot:
    return UserSnapshot(
        telegram_id=user.telegram_id,
        username=user.username,
        first_name=user.first_name,
        created_at=user.created_at,
        subscription_status=user.subscription_status,
    )


async def get_user_snapshot(telegram_id: int) -> UserSnapshot | None:
    cached = _get_cached_user(telegram_id)
    if cached:
        return cached

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.telegram_id == telegram_id))
            user = result.scalar_one_or_none()
            if not user:
                return None
            snapshot = _make_snapshot(user)
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
                _set_cached_user(_make_snapshot(user))
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
            _set_cached_user(_make_snapshot(new_user))
            return new_user
    except (DBAPIError, OSError, Exception) as e:
        print(f"user_service error: {e}")
        return None
