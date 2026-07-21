import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Factory AI Dashboard API"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/factory_db"
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
