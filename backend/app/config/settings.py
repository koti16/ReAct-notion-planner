import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    NOTION_TOKEN: str | None = os.getenv("NOTION_TOKEN")
    NOTION_DATABASE_ID: str | None = os.getenv("NOTION_DATABASE_ID")


settings = Settings()
