"""Application configuration module."""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuration settings for ETL service."""

    # Environment & Server
    ENV: str = os.getenv("ENV", "development")
    APP_NAME: str = "PostgreSQL to BigQuery Sales ETL Pipeline"
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", "8000"))
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # PostgreSQL Configuration
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "sales_db")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}",
    )
    SOURCE_TABLE_NAME: str = os.getenv("SOURCE_TABLE_NAME", "raw_sales_orders")
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "1000"))

    # BigQuery Configuration
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6")
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "dev_sales")
    BIGQUERY_TABLE: str = os.getenv("BIGQUERY_TABLE", "fct_sales_orders_v1")
    BIGQUERY_PARTITION_FIELD: str = "order_date"
    BIGQUERY_CLUSTERING_FIELDS: List[str] = ["order_id"]

    # Testing Flag
    TESTING: bool = os.getenv("TESTING", "false").lower() in ("true", "1", "yes")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
