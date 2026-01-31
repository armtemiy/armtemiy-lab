import asyncio
from dataclasses import dataclass
from datetime import datetime
from time import time

from bot.services import user_service


@dataclass
class FakeUser:
    telegram_id: int
    username: str | None
    first_name: str | None
    created_at: datetime
    subscription_status: bool


@dataclass
class FakeSparringProfile:
    telegram_user_id: str
    style: str
    weight_kg: float | None
    experience_years: float | None
    is_active: bool


class DummySession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None


class DummySessionFactory:
    def __call__(self):
        return DummySession()


def test_get_user_snapshot_cached(monkeypatch):
    user_service._user_cache.clear()
    cached_snapshot = user_service.UserSnapshot(
        telegram_id=1,
        username="tester",
        first_name="Test",
        created_at=datetime.utcnow(),
        subscription_status=False,
        sparring_stats=None
    )
    user_service._user_cache[1] = (time(), cached_snapshot)

    async def fail_fetch_user(*args, **kwargs):
        raise AssertionError("DB should not be called when cache is valid")

    monkeypatch.setattr(user_service, "_fetch_user", fail_fetch_user)

    result = asyncio.run(user_service.get_user_snapshot(1))
    assert result == cached_snapshot


def test_get_user_snapshot_fetches_and_caches(monkeypatch):
    user_service._user_cache.clear()
    monkeypatch.setattr(user_service, "AsyncSessionLocal", DummySessionFactory())

    async def fake_fetch_user(session, telegram_id):
        return FakeUser(
            telegram_id=telegram_id,
            username="tester",
            first_name="Test",
            created_at=datetime(2024, 1, 1),
            subscription_status=False
        )

    async def fake_fetch_sparring_profile(session, telegram_id):
        return FakeSparringProfile(
            telegram_user_id=str(telegram_id),
            style="both",
            weight_kg=70.0,
            experience_years=3.5,
            is_active=True
        )

    monkeypatch.setattr(user_service, "_fetch_user", fake_fetch_user)
    monkeypatch.setattr(user_service, "_fetch_sparring_profile", fake_fetch_sparring_profile)

    result = asyncio.run(user_service.get_user_snapshot(99))

    assert result is not None
    assert result.telegram_id == 99
    assert result.sparring_stats == "Универсал, 70.0кг, стаж 3.5г"
    assert 99 in user_service._user_cache
