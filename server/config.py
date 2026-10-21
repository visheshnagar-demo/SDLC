"""Configuration settings for Garba Management System."""
import os


class Settings:
    PROJECT_NAME: str = "Garba Management System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./garba_management.db")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "garba-super-secret-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    HMAC_SECRET_KEY: str = os.getenv("HMAC_SECRET_KEY", "garba-event-hmac-secret-key-2026")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")


settings = Settings()
