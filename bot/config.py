import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://armtemiy.github.io/armtemiy-lab/")
CHANNEL_ID = os.getenv("CHANNEL_ID", "@armtemiy")
CHANNEL_URL = os.getenv("CHANNEL_URL", "https://t.me/armtemiy")
DATABASE_URL = os.getenv("DATABASE_URL")

# Поддержка списка админов через запятую "123,456"
admin_ids_str = os.getenv("ADMIN_IDS", os.getenv("ADMIN_ID", "0"))
ADMIN_IDS = [int(x.strip()) for x in admin_ids_str.split(",") if x.strip().isdigit()]
if not ADMIN_IDS:
    ADMIN_IDS = []

# Пользователи с расширенными правами (без доступа к админке)
privileged_ids_str = os.getenv("PRIVILEGED_IDS", "6228333693")
PRIVILEGED_IDS = [int(x.strip()) for x in privileged_ids_str.split(",") if x.strip().isdigit()]
