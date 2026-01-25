from aiogram import Router, F
from aiogram.types import Message
from aiogram.enums import ParseMode
from aiogram.filters import Command
from sqlalchemy import select, func

from bot.config import ADMIN_IDS
from bot.db.database import AsyncSessionLocal
from bot.db.models import User, SparringProfile

router = Router()

@router.message(Command("admin"))
@router.message(F.text == "⚙️ Админка")
async def cmd_admin_panel(message: Message) -> None:
    if message.from_user.id not in ADMIN_IDS:
        # Игнорируем обычных юзеров (или можно ответить "Команда не найдена")
        return

    async with AsyncSessionLocal() as session:
        # Считаем пользователей
        result_users = await session.execute(select(func.count(User.id)))
        total_users = result_users.scalar() or 0
        
        # Считаем спарринг профили
        result_profiles = await session.execute(select(func.count(SparringProfile.id)))
        total_profiles = result_profiles.scalar() or 0
        
        # Считаем активные
        result_active = await session.execute(select(func.count(SparringProfile.id)).where(SparringProfile.is_active == True))
        active_profiles = result_active.scalar() or 0

    text = (
        "⚙️ <b>Админ-панель</b>\n\n"
        f"👥 Всего в боте: <b>{total_users}</b>\n"
        f"🥊 Спарринг-профилей: <b>{total_profiles}</b> (Активных: {active_profiles})\n\n"
        "Команды:\n"
        "/broadcast - Рассылка (в разработке)\n"
        "/stats - Обновить статистику"
    )
    
    await message.answer(text, parse_mode=ParseMode.HTML)
