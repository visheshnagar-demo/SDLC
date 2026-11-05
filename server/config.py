import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "Daily Batch Sales ETL Pipeline"
    GCP_PROJECT: str = os.getenv(
        "GCP_PROJECT", os.getenv("GOOGLE_CLOUD_PROJECT", "upbeat-repeater-477110-q6")
    )
    GCS_SOURCE_URI: str = os.getenv(
        "GCS_SOURCE_URI",
        "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv",
    )
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "analytics")
    BIGQUERY_TABLE: str = os.getenv("BIGQUERY_TABLE", "new_sales_orders")
    PARTITION_FIELD: str = os.getenv("PARTITION_FIELD", "created_at")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    BATCH_TIMEOUT_SECONDS: int = int(os.getenv("BATCH_TIMEOUT_SECONDS", "300"))


settings = Settings()
