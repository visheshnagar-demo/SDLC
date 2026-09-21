import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "API Health Monitoring Dashboard"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(",")
        if origin.strip()
    ]
    DEFAULT_POLL_TIMEOUT: float = float(os.getenv("DEFAULT_POLL_TIMEOUT", "5.0"))
    LOG_RETENTION_DAYS: int = int(os.getenv("LOG_RETENTION_DAYS", "30"))
    ALLOW_INTERNAL_IPS: bool = os.getenv("ALLOW_INTERNAL_IPS", "true").lower() in (
        "true",
        "1",
        "yes",
    )
    TESTING: bool = os.getenv("TESTING", "false").lower() in ("true", "1", "yes")


settings = Settings()
