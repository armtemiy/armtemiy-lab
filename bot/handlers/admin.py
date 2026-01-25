from aiogram import Router, F
from aiogram.types import Message
from aiogram.enums import ParseMode
from sqlalchemy import select, func

from bot.config import ADMIN_ID
from bot.db.database import AsyncSessionLocal
from bot.db.models import User

router = Router()

@router.message(F.text == "⚙️ Админка")
async def cmd_admin_panel(message: Message) -> None:
    if message.from_user.id != ADMIN_ID:
        await message.answer("⛔ Нет доступа")
        return

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(func.count(User.id)))
        total_users = result.scalar() or 0

    text = (
        "⚙️ <b>Админ-панель</b>\n\n"
        f"👥 Пользователей: <b>{total_users}</b>\n\n"
        "<i>Расширенный функционал в разработке</i>"
    )
    
    await message.answer(text, parse_mode=ParseMode.HTML)
