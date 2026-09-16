import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # PostgreSQL Configuration
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "postgres"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    DATABASE_URL: Optional[str] = None

    # BigQuery Configuration
    BIGQUERY_PROJECT_ID: str = "upbeat-repeater-477110-q6"
    BIGQUERY_DATASET: str = "sales_analytics"
    BIGQUERY_TABLE: str = "fct_sales_orders"
    BIGQUERY_LOCATION: str = "US"
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # Application Settings
    PORT: int = 8000
    AUTO_BOOT_ETL: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
