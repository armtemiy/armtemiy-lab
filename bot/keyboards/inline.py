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
