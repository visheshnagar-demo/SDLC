import json
import os
from typing import Any, List
from pydantic import field_validator
try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    from pydantic import BaseModel as BaseSettings
    SettingsConfigDict = None


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sales Data ETL Pipeline Service"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret")

    BIGQUERY_PROJECT: str = os.getenv("BIGQUERY_PROJECT", "upbeat-repeater-477110-q6")
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "sales_analytics")
    BIGQUERY_TABLE: str = os.getenv("BIGQUERY_TABLE", "fct_sales_orders")

    if SettingsConfigDict:
        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            extra="ignore",
        )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if v is None:
            return ["http://localhost:5173", "http://localhost:3000"]
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple, set)):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return []


settings = Settings()
