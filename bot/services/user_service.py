from sqlalchemy import select
from bot.db.database import AsyncSessionLocal
from bot.db.models import User

async def get_or_create_user(telegram_id: int, username: str | None = None, first_name: str | None = None) -> User:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.telegram_id == telegram_id))
        user = result.scalar_one_or_none()

        if user:
            # Обновляем инфо если изменилось
            if user.username != username or user.first_name != first_name:
                user.username = username
                user.first_name = first_name
                await session.commit()
            return user
        
        # Создаем нового
        new_user = User(
            telegram_id=telegram_id,
            username=username,
            first_name=first_name,
            subscription_status=False 
        )
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        return new_user
