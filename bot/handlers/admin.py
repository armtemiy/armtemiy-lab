import asyncio
from dataclasses import dataclass
from enum import Enum

from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from loguru import logger
from sqlalchemy import select, func

from bot.config import ADMIN_IDS
from bot.db.database import AsyncSessionLocal
from bot.db.models import User, SparringProfile
from bot.keyboards.inline import get_admin_keyboard
from bot.states import AdminStates

router = Router()


class AdminCommand(str, Enum):
    ADMIN = "admin"
    CHECK_ID = "check_id"
    CANCEL = "cancel"


class AdminCallback(str, Enum):
    STATS = "admin_stats"
    BROADCAST = "admin_broadcast"


ADMIN_BUTTON_TEXT = "⚙️ Админка"
NO_ACCESS_TEXT = "⛔ Нет доступа"
CANCEL_COMMAND = f"/{AdminCommand.CANCEL.value}"
BROADCAST_PROMPT = f"📢 Введите текст для рассылки (или {CANCEL_COMMAND} для отмены):"
BROADCAST_CANCELLED = "❌ Рассылка отменена."
BROADCAST_START = "⏳ Начинаю рассылку..."
BROADCAST_DONE = "✅ Рассылка завершена. Отправлено: {count}"
BROADCAST_BATCH_SIZE = 20
BROADCAST_PAUSE_SECONDS = 1


@dataclass(frozen=True)
class AdminStats:
    total_users: int
    total_profiles: int
    active_profiles: int


def is_admin(user_id: int | None) -> bool:
    return user_id is not None and user_id in ADMIN_IDS


async def fetch_stats() -> AdminStats:
    async with AsyncSessionLocal() as session:
        users_result = await session.execute(select(func.count(User.id)))
        profiles_result = await session.execute(select(func.count(SparringProfile.id)))
        active_result = await session.execute(
            select(func.count(SparringProfile.id)).where(SparringProfile.is_active.is_(True))
        )

    return AdminStats(
        total_users=users_result.scalar() or 0,
        total_profiles=profiles_result.scalar() or 0,
        active_profiles=active_result.scalar() or 0
    )


def render_stats(stats: AdminStats) -> str:
    return (
        "⚙️ <b>Админ-панель</b>\n\n"
        f"👥 Всего в боте: <b>{stats.total_users}</b>\n"
        f"🥊 Спарринг-профилей: <b>{stats.total_profiles}</b> (Активных: {stats.active_profiles})"
    )


@router.message(Command(AdminCommand.CHECK_ID.value))
async def cmd_check_id(message: Message) -> None:
    user_id = message.from_user.id if message.from_user else None
    if user_id is None:
        return

    await message.answer(
        f"🆔 Ваш ID: <code>{user_id}</code>\n"
        f"👮 Админ: {'✅ Да' if is_admin(user_id) else '❌ Нет'}",
        parse_mode=ParseMode.HTML
    )


@router.message(Command(AdminCommand.ADMIN.value))
@router.message(F.text == ADMIN_BUTTON_TEXT)
async def cmd_admin_panel(message: Message) -> None:
    user_id = message.from_user.id if message.from_user else None
    if not is_admin(user_id):
        return

    stats = await fetch_stats()
    await message.answer(
        render_stats(stats),
        parse_mode=ParseMode.HTML,
        reply_markup=get_admin_keyboard()
    )


@router.callback_query(F.data == AdminCallback.STATS.value)
async def cb_admin_stats(callback: CallbackQuery) -> None:
    if not is_admin(callback.from_user.id if callback.from_user else None):
        await callback.answer(NO_ACCESS_TEXT, show_alert=True)
        return

    if not callback.message or not isinstance(callback.message, Message):
        await callback.answer("Сообщение не найдено", show_alert=True)
        return

    stats = await fetch_stats()
    try:
        await callback.message.edit_text(
            render_stats(stats),
            parse_mode=ParseMode.HTML,
            reply_markup=get_admin_keyboard()
        )
        await callback.answer("✅ Статистика обновлена")
    except Exception as exc:
        logger.warning("admin stats edit failed: {}", type(exc).__name__)
        await callback.answer("✅ Данные актуальны")


@router.callback_query(F.data == AdminCallback.BROADCAST.value)
async def cb_admin_broadcast(callback: CallbackQuery, state: FSMContext) -> None:
    if not is_admin(callback.from_user.id if callback.from_user else None):
        await callback.answer(NO_ACCESS_TEXT, show_alert=True)
        return

    if not callback.message or not isinstance(callback.message, Message):
        await callback.answer("Сообщение не найдено", show_alert=True)
        return

    await callback.message.answer(BROADCAST_PROMPT)
    await state.set_state(AdminStates.waiting_for_broadcast_text)
    await callback.answer()


@router.message(AdminStates.waiting_for_broadcast_text)
async def process_broadcast(message: Message, state: FSMContext, bot: Bot) -> None:
    text = message.text or ""
    if text.strip() == CANCEL_COMMAND:
        await message.answer(BROADCAST_CANCELLED)
        await state.clear()
        return

    if not text.strip():
        await message.answer("Сообщение пустое. Введите текст или /cancel.")
        return

    status_msg = await message.answer(BROADCAST_START)
    user_ids = await _fetch_user_ids()

    sent_count = 0
    failed_count = 0
    for index, user_id in enumerate(user_ids, start=1):
        try:
            await bot.send_message(user_id, text)
            sent_count += 1
            if index % BROADCAST_BATCH_SIZE == 0:
                await asyncio.sleep(BROADCAST_PAUSE_SECONDS)
        except Exception as exc:
            failed_count += 1
            logger.warning("broadcast send failed: {}", type(exc).__name__)

    summary = BROADCAST_DONE.format(count=sent_count)
    if failed_count:
        summary += f" (ошибок: {failed_count})"
    await status_msg.edit_text(summary)
    await state.clear()


async def _fetch_user_ids() -> list[int]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User.telegram_id))
        return list(result.scalars().all())
