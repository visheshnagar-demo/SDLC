import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "Hospital Management System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/hospital_app.db")
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "dev-hospital-secret-key-change-in-prod-2026"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(",")
        if origin.strip()
    ]


settings = Settings()
