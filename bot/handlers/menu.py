import asyncio
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.enums import ParseMode

from bot.services.user_service import get_user_snapshot

router = Router()

@router.message(Command("profile"))
@router.message(F.text == "👤 Профиль")
async def cmd_profile(message: Message) -> None:
    user_id = message.from_user.id

    user = None
    try:
        user = await asyncio.wait_for(get_user_snapshot(user_id), timeout=1.2)
    except asyncio.TimeoutError:
        user = None

    if not user:
        # Если не удалось получить пользователя из БД, пробуем еще раз без тайм-аута или просто логируем
        try:
             # Попытка без жесткого тайм-аута или повтор
             user = await get_user_snapshot(user_id)
        except Exception as e:
             pass

    if not user:
        first_name = message.from_user.first_name or '—'
        text = (
            f"👤 <b>Профиль</b>\n\n"
            f"🆔 ID: <code>{user_id}</code>\n"
            f"👋 Имя: {first_name}\n\n"
            "⚠️ Не удалось загрузить данные из базы. Попробуйте позже."
        )
        await message.answer(text, parse_mode=ParseMode.HTML)
        return

    text = (
        f"👤 <b>Профиль</b>\n\n"
        f"🆔 ID: <code>{user.telegram_id}</code>\n"
        f"👋 Имя: {user.first_name or '—'}\n"
        f"📅 Регистрация: {user.created_at.strftime('%d.%m.%Y')}\n"
    )

    if user.sparring_stats:
        text += f"\n💪 <b>Спарринг-профиль:</b>\n{user.sparring_stats}"
    else:
        text += "\n💪 <b>Спарринг-профиль:</b> Не создан"
    
    await message.answer(text, parse_mode=ParseMode.HTML)

@router.message(Command("info"))
@router.message(F.text == "ℹ️ Инфо")
async def cmd_info(message: Message) -> None:
    text = (
        "ℹ️ <b>Контакты</b>\n\n"
        "📢 Канал: @armtemiy\n"
        "💬 Чат: https://t.me/+Rh5ng2X8R1k5OTJi\n\n"
        "Если WebApp пишет \"откройте через Telegram\", просто закройте и откройте WebApp заново — это обновляет сессию."
    )
    await message.answer(text, parse_mode=ParseMode.HTML)
