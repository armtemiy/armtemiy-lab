import asyncio
from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from sqlalchemy import select, func

from bot.config import ADMIN_IDS
from bot.db.database import AsyncSessionLocal
from bot.db.models import User, SparringProfile
from bot.keyboards.inline import get_admin_keyboard
from bot.states import AdminStates

router = Router()

@router.message(Command("check_id"))
async def cmd_check_id(message: Message) -> None:
    user_id = message.from_user.id
    is_admin = user_id in ADMIN_IDS
    await message.answer(
        f"🆔 Ваш ID: <code>{user_id}</code>\n"
        f"👮 Админ: {'✅ Да' if is_admin else '❌ Нет'}",
        parse_mode=ParseMode.HTML
    )

@router.message(Command("admin"))
@router.message(F.text == "⚙️ Админка")
async def cmd_admin_panel(message: Message) -> None:
    if message.from_user.id not in ADMIN_IDS:
        return

    text = await get_stats_text()
    await message.answer(text, parse_mode=ParseMode.HTML, reply_markup=get_admin_keyboard())

@router.callback_query(F.data == "admin_stats")
async def cb_admin_stats(callback: CallbackQuery) -> None:
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Нет доступа", show_alert=True)
        return

    text = await get_stats_text()
    # Пытаемся отредактировать сообщение (если текст изменился)
    try:
        await callback.message.edit_text(text, parse_mode=ParseMode.HTML, reply_markup=get_admin_keyboard())
        await callback.answer("✅ Статистика обновлена")
    except Exception:
        await callback.answer("✅ Данные актуальны")

@router.callback_query(F.data == "admin_broadcast")
async def cb_admin_broadcast(callback: CallbackQuery, state: FSMContext) -> None:
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Нет доступа", show_alert=True)
        return

    await callback.message.answer("📢 Введите текст для рассылки (или /cancel для отмены):")
    await state.set_state(AdminStates.waiting_for_broadcast_text)
    await callback.answer()

@router.message(AdminStates.waiting_for_broadcast_text)
async def process_broadcast(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.text == "/cancel":
        await message.answer("❌ Рассылка отменена.")
        await state.clear()
        return

    text_to_send = message.text
    count = 0
    
    status_msg = await message.answer("⏳ Начинаю рассылку...")

    async with AsyncSessionLocal() as session:
        # Получаем всех пользователей (лучше батчами, но пока просто всех ID)
        result = await session.execute(select(User.telegram_id))
        user_ids = result.scalars().all()

    for uid in user_ids:
        try:
            await bot.send_message(uid, text_to_send)
            count += 1
            # Небольшая задержка чтобы не словить FloodWait
            if count % 20 == 0:
                await asyncio.sleep(1)
        except Exception:
            pass # Игнорируем заблокировавших бота

    await status_msg.edit_text(f"✅ Рассылка завершена. Отправлено: {count}")
    await state.clear()

async def get_stats_text() -> str:
    async with AsyncSessionLocal() as session:
        result_users = await session.execute(select(func.count(User.id)))
        total_users = result_users.scalar() or 0
        
        result_profiles = await session.execute(select(func.count(SparringProfile.id)))
        total_profiles = result_profiles.scalar() or 0
        
        result_active = await session.execute(select(func.count(SparringProfile.id)).where(SparringProfile.is_active == True))
        active_profiles = result_active.scalar() or 0

    return (
        "⚙️ <b>Админ-панель</b>\n\n"
        f"👥 Всего в боте: <b>{total_users}</b>\n"
        f"🥊 Спарринг-профилей: <b>{total_profiles}</b> (Активных: {active_profiles})"
    )
