import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/api_monitor.db")
ALLOWED_ORIGINS_RAW: str = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
ALLOWED_ORIGINS: List[str] = [
    origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()
]

DEFAULT_POLL_TIMEOUT: float = float(os.getenv("DEFAULT_POLL_TIMEOUT", "5.0"))
LOG_RETENTION_DAYS: int = int(os.getenv("LOG_RETENTION_DAYS", "30"))
PORT: int = int(os.getenv("PORT", "8000"))
TESTING: bool = os.getenv("TESTING", "false").lower() in ("true", "1", "t")
ENABLE_BACKGROUND_POLLER: bool = (
    os.getenv("ENABLE_BACKGROUND_POLLER", "true").lower() in ("true", "1", "t")
    and not TESTING
)
