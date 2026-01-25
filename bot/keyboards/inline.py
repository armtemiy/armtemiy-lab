import os
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

CHANNEL_URL = os.getenv("CHANNEL_URL", "https://t.me/armtemiy")

def get_subscription_keyboard() -> InlineKeyboardMarkup:
    """
    Клавиатура с просьбой подписаться.
    """
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="📢 Подписаться на канал", url=CHANNEL_URL)],
            [InlineKeyboardButton(text="✅ Я подписался", callback_data="check_subscription")]
        ]
    )

def get_admin_keyboard() -> InlineKeyboardMarkup:
    """
    Клавиатура админ-панели.
    """
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="📊 Статистика", callback_data="admin_stats"),
                InlineKeyboardButton(text="📢 Рассылка", callback_data="admin_broadcast")
            ]
        ]
    )
