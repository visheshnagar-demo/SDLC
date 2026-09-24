import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./preservation.db")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-museum-preservation-2026")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
TESTING = os.getenv("TESTING", "false").lower() in ("true", "1", "yes")
