from aiogram import BaseMiddleware
from aiogram.types import Update, Message
from datetime import datetime, timedelta
from typing import Any, Awaitable, Callable, Dict
import os
from sqlalchemy import select, func, delete

# Импортируем нашу новую асинхронную фабрику сессий и модель
from bot.db.database import AsyncSessionLocal
from bot.db.models import RateLimitEntry

class SpamProtectionMiddleware(BaseMiddleware):
    """
    Защита от спама с хранением в БД (Async).
    """

    MAX_REQUESTS = 30
    TIME_PERIOD = 60
    SKIP_ADMINS = True
    
    # Можно вынести в config, но пока возьмем из env или хардкод (если нет в env)
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

        if not await self._check_limit(user_id):
            await self._send_rate_limit_exceeded(event)
            return

        await self._add_request(user_id)
        return await handler(event, data)

    def _extract_user_id(self, event: Update) -> int | None:
        if event.message:
            return event.message.from_user.id
        elif event.callback_query:
            return event.callback_query.from_user.id
        elif event.edited_message:
            return event.edited_message.from_user.id
        # Добавить другие типы обновлений при необходимости
        return None

    async def _send_rate_limit_exceeded(self, event: Update) -> None:
        if event.message:
            await event.message.answer("⚠️ Слишком много запросов. Подожди немного.")
        elif event.callback_query:
            await event.callback_query.answer("⚠️ Слишком много запросов.")

    async def _check_limit(self, telegram_id: int) -> bool:
        async with AsyncSessionLocal() as session:
            cutoff_time = datetime.utcnow() - timedelta(seconds=self.TIME_PERIOD)
            
            # SQLAlchemy 2.0 style
            stmt = select(func.count(RateLimitEntry.id)).where(
                RateLimitEntry.telegram_id == telegram_id,
                RateLimitEntry.created_at >= cutoff_time
            )
            result = await session.execute(stmt)
            count = result.scalar() or 0
            
            return count < self.MAX_REQUESTS

    async def _add_request(self, telegram_id: int) -> None:
        async with AsyncSessionLocal() as session:
            entry = RateLimitEntry(telegram_id=telegram_id)
            session.add(entry)
            await session.commit()
