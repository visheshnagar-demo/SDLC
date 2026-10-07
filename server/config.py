import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "Hotel Management System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")


settings = Settings()
