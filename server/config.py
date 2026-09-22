import os
from typing import List


class Settings:
    PROJECT_NAME: str = "Chrono Certified - Luxury Second-Hand Branded Watches API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./watches.db")
    TESTING: bool = os.getenv("TESTING", "false").lower() == "true"

    # JWT Security
    SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "dev-luxury-watches-secret-key-change-in-production-2026"
    )
    ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )  # 24 hours

    # Reservation Hold Duration in minutes
    RESERVATION_HOLD_MINUTES: int = 15

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]


settings = Settings()
