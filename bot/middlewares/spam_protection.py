from aiogram import BaseMiddleware
from aiogram.types import Update
from collections import deque
from datetime import datetime, timedelta
from time import monotonic
from typing import Any, Awaitable, Callable, Deque, Dict
import os
from sqlalchemy import select, func
from sqlalchemy.exc import DBAPIError

from bot.db.database import AsyncSessionLocal
from bot.db.models import RateLimitEntry

class SpamProtectionMiddleware(BaseMiddleware):
    """
    Защита от спама с хранением в БД (Async).
    С обработкой ошибок подключения.
    """

    MAX_REQUESTS = 30
    TIME_PERIOD = 60
    SKIP_ADMINS = True
    RATE_LIMIT_BACKEND = os.getenv("RATE_LIMIT_BACKEND", "memory").lower()

    _memory_requests: Dict[int, Deque[float]] = {}

    ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))

    async def __call__(
        self,
        handler: Callable[[Update, Dict[str, Any]], Awaitable[Any]],
        event: Update,
        data: Dict[str, Any]
    ) -> Any:
        user_id = self._extract_user_id(event)

        if user_id is None:
            return await handler(event, data)

        if self.SKIP_ADMINS and user_id == self.ADMIN_ID:
            return await handler(event, data)

        if self.RATE_LIMIT_BACKEND == "db":
            try:
                if not await self._check_limit_db(user_id):
                    await self._send_rate_limit_exceeded(event)
                    return
                await self._add_request_db(user_id)
            except (DBAPIError, OSError, Exception) as e:
                print(f"SpamProtection DB error (skipping check): {e}")
        else:
            if not self._check_limit_memory(user_id):
                await self._send_rate_limit_exceeded(event)
                return
            self._add_request_memory(user_id)

        return await handler(event, data)

    def _extract_user_id(self, event: Update) -> int | None:
        if event.message:
            return event.message.from_user.id
        elif event.callback_query:
            return event.callback_query.from_user.id
        elif event.edited_message:
            return event.edited_message.from_user.id
        return None

    async def _send_rate_limit_exceeded(self, event: Update) -> None:
        if event.message:
            await event.message.answer("Слишком много запросов. Подожди немного.")
        elif event.callback_query:
            await event.callback_query.answer("Слишком много запросов.")

    def _check_limit_memory(self, telegram_id: int) -> bool:
        now = monotonic()
        window_start = now - self.TIME_PERIOD

        bucket = self._memory_requests.get(telegram_id)
        if bucket is None:
            bucket = deque()
            self._memory_requests[telegram_id] = bucket

        while bucket and bucket[0] < window_start:
            bucket.popleft()

        return len(bucket) < self.MAX_REQUESTS

    def _add_request_memory(self, telegram_id: int) -> None:
        bucket = self._memory_requests.get(telegram_id)
        if bucket is None:
            bucket = deque()
            self._memory_requests[telegram_id] = bucket
        bucket.append(monotonic())

    async def _check_limit_db(self, telegram_id: int) -> bool:
        async with AsyncSessionLocal() as session:
            cutoff_time = datetime.utcnow() - timedelta(seconds=self.TIME_PERIOD)
            
            stmt = select(func.count(RateLimitEntry.id)).where(
                RateLimitEntry.telegram_id == telegram_id,
                RateLimitEntry.created_at >= cutoff_time
            )
            result = await session.execute(stmt)
            count = result.scalar() or 0
            
            return count < self.MAX_REQUESTS

    async def _add_request_db(self, telegram_id: int) -> None:
        async with AsyncSessionLocal() as session:
            entry = RateLimitEntry(telegram_id=telegram_id)
            session.add(entry)
            await session.commit()
