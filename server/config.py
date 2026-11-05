"""Configuration settings for the Sales Order ETL Batch Pipeline."""

import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    GCS_SOURCE_URI: str = Field(
        default="gs://sdlc-workspec-store/etl/data/raw_sales_data.csv",
        description="GCS URI for input raw sales order CSV file",
    )
    GCP_PROJECT: str = Field(
        default_factory=lambda: os.getenv(
            "GCP_PROJECT",
            os.getenv("GOOGLE_CLOUD_PROJECT", "upbeat-repeater-477110-q6"),
        ),
        description="Google Cloud Platform Project ID",
    )
    BQ_DATASET: str = Field(
        default="analytics",
        description="BigQuery destination dataset name",
    )
    BQ_TABLE: str = Field(
        default="new_sales_orders",
        description="BigQuery destination table name",
    )
    LOG_LEVEL: str = Field(
        default="INFO",
        description="Application logging level",
    )

    @property
    def bq_table_id(self) -> str:
        """Fully qualified BigQuery table identifier."""
        return f"{self.GCP_PROJECT}.{self.BQ_DATASET}.{self.BQ_TABLE}"


settings = Settings()
