"""Application configuration settings."""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="allow", env_file=".env")

    PROJECT_NAME: str = "Greenfield Cloud Management System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/cloud_management.db")
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "dev-secret-key-change-in-production-must-be-secure"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    ENCRYPTION_MASTER_KEY: str = os.getenv(
        "ENCRYPTION_MASTER_KEY", "u6w9z$C&F)J@NcRfUjWnZr4u7x!A%D*G"
    )
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    )


settings = Settings()
