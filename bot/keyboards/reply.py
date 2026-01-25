from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from bot.config import ADMIN_IDS, WEBAPP_URL

def get_main_menu_keyboard(user_id: int) -> ReplyKeyboardMarkup:
    """
    Главное меню бота с кнопкой WebApp.
    """
    keyboard = [
        [
            KeyboardButton(text="📱 Открыть приложение", web_app=WebAppInfo(url=WEBAPP_URL)),
        ],
        [
            KeyboardButton(text="👤 Профиль"),
            KeyboardButton(text="ℹ️ Инфо"),
        ]
    ]
    
    # Добавляем кнопку админки если юзер админ
    if user_id in ADMIN_IDS:
        keyboard.append([KeyboardButton(text="⚙️ Админка")])
    
    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,
        one_time_keyboard=False
    )
