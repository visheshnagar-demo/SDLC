import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Livestock Cattle Management & Tracking System (Cows System)"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cows.db")
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "cows-super-secret-key-change-in-production-2026"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
