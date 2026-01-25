from aiogram import Router, Bot, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart
from aiogram.enums import ParseMode

from bot.services.subscription import check_subscription
from bot.services.user_service import get_or_create_user
from bot.keyboards.inline import get_subscription_keyboard
from bot.keyboards.reply import get_main_menu_keyboard
from loguru import logger

router = Router()

@router.message(CommandStart())
async def cmd_start(message: Message, bot: Bot) -> None:
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name or "друг"
    
    # Проверка подписки
    is_subscribed = await check_subscription(bot, user_id)
    
    if not is_subscribed:
        await message.answer(
            "👋 Привет! Чтобы пользоваться ботом, подпишись на канал.",
            reply_markup=get_subscription_keyboard(),
            parse_mode=ParseMode.HTML
        )
        return

    # Регистрация/вход
    await get_or_create_user(
        telegram_id=user_id,
        username=username,
        first_name=first_name
    )
    
    logger.info(f"User {user_id} (@{username}) started bot")
    
    text = (
        f"👋 Привет, {first_name}!\n\n"
        "Я Armtemiy Lab — помощник армрестлера.\n\n"
        "Меню 👇"
    )
    
    await message.answer(
        text,
        reply_markup=get_main_menu_keyboard(user_id),
        parse_mode=ParseMode.HTML
    )

@router.callback_query(F.data == "check_subscription")
async def callback_check_subscription(callback: CallbackQuery, bot: Bot) -> None:
    is_subscribed = await check_subscription(bot, callback.from_user.id)
    
    if is_subscribed:
        await callback.message.delete()
        first_name = callback.from_user.first_name or "друг"
        
        await get_or_create_user(
            telegram_id=callback.from_user.id,
            username=callback.from_user.username,
            first_name=first_name
        )
        
        text = (
            f"✅ Спасибо за подписку, <b>{first_name}</b>!\n\n"
            "Добро пожаловать в Armtemiy Lab 👇"
        )
        
        await callback.message.answer(
            text,
            reply_markup=get_main_menu_keyboard(callback.from_user.id),
            parse_mode=ParseMode.HTML
        )
    else:
        await callback.answer("❌ Подписка не найдена. Попробуй ещё раз.", show_alert=True)
