from aiogram import Router, F
from aiogram.types import Message
from aiogram.enums import ParseMode
from sqlalchemy import select

from bot.db.database import AsyncSessionLocal
from bot.db.models import User

router = Router()

@router.message(F.text == "👤 Профиль")
async def cmd_profile(message: Message) -> None:
    user_id = message.from_user.id
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.telegram_id == user_id))
        user = result.scalar_one_or_none()
    
    if not user:
        await message.answer("Профиль не найден. Нажми /start")
        return

    text = (
        f"👤 <b>Профиль</b>\n\n"
        f"🆔 ID: <code>{user.telegram_id}</code>\n"
        f"👋 Имя: {user.first_name or '—'}\n"
        f"📅 Регистрация: {user.created_at.strftime('%d.%m.%Y')}"
    )
    
    await message.answer(text, parse_mode=ParseMode.HTML)

@router.message(F.text == "ℹ️ Инфо")
async def cmd_info(message: Message) -> None:
    text = (
        "ℹ️ <b>Контакты</b>\n\n"
        "📢 Канал: @armtemiy\n"
        "💬 Чат: https://t.me/+Rh5ng2X8R1k5OTJi"
    )
    await message.answer(text, parse_mode=ParseMode.HTML)
