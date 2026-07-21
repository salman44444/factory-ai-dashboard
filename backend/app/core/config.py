import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Factory AI Dashboard API"
    PROJECT_DESCRIPTION: str = "Real-time industrial telemetry and predictive maintenance API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # OpenAPI & Swagger UI Configuration
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"
    OPENAPI_URL: str = "/openapi.json"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/factory_db"
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
