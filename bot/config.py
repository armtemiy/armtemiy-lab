import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://armtemiy.github.io/armtemiy-lab/")
CHANNEL_ID = os.getenv("CHANNEL_ID", "@armtemiy")
CHANNEL_URL = os.getenv("CHANNEL_URL", "https://t.me/armtemiy")
DATABASE_URL = os.getenv("DATABASE_URL")
ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))
