import os


class Settings:
    PROJECT_NAME: str = (
        "Hospital Management System (HMS) Core Platform & Patient Portal"
    )
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/hms_test.db")
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "hms-secret-key-super-secure-2026"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for dev/testing
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
    )
    TESTING: bool = os.getenv("TESTING", "false").lower() == "true"


settings = Settings()
