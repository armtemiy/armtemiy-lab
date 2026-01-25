import os
from aiogram import Bot
from aiogram.enums import ChatMemberStatus

# Получаем из env, например @armtemiy
CHANNEL_ID = os.getenv("CHANNEL_ID", "@armtemiy")

async def check_subscription(bot: Bot, user_id: int) -> bool:
    """
    Проверяет, подписан ли пользователь на канал.
    """
    try:
        # Если канал не задан, пропускаем проверку (для разработки)
        if not CHANNEL_ID or CHANNEL_ID == "@channel": 
             return True

        chat_member = await bot.get_chat_member(
            chat_id=CHANNEL_ID,
            user_id=user_id
        )

        subscribed_statuses = [
            ChatMemberStatus.MEMBER,
            ChatMemberStatus.ADMINISTRATOR,
            ChatMemberStatus.CREATOR,
        ]

        return chat_member.status in subscribed_statuses

    except Exception as e:
        # Логирование ошибки лучше добавить
        print(f"Error checking subscription: {e}")
        # Если ошибка (например, бот не админ канала), возвращаем False или True в зависимости от строгости
        # Обычно лучше вернуть False и попросить проверить права
        return False
