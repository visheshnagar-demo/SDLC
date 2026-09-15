import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "ACH Velocity Limits API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ach_velocity.db")
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    )

    # Velocity thresholds in USD
    SOFT_LIMIT_THRESHOLD: float = 5000.00
    HARD_LIMIT_THRESHOLD: float = 10000.00
    VELOCITY_WINDOW_HOURS: int = 24

    class Config:
        case_sensitive = True


settings = Settings()
