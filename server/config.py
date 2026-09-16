import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sales Orders ETL Service"
    API_V1_STR: str = "/api/v1"

    # Database configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sales_etl.db")

    # Google Cloud / BigQuery configuration
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "local-gcp-project")
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "dev_sales")
    BIGQUERY_TABLE: str = os.getenv("BIGQUERY_TABLE", "fct_sales_orders")

    # CORS configuration
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    )

    # Testing flag
    TESTING: bool = os.getenv("TESTING", "false").lower() in ("true", "1", "t")

    @property
    def cors_origins(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]

    class Config:
        case_sensitive = True
        extra = "allow"


settings = Settings()
