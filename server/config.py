import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "Payment Gateway & ETL Service"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret")

    # Cloud SQL PostgreSQL Source Configuration
    INSTANCE_CONNECTION_NAME: str = os.getenv(
        "INSTANCE_CONNECTION_NAME",
        "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db",
    )
    DB_USER: str = os.getenv("DB_USER", "559906504681-compute@developer")
    DB_NAME: str = os.getenv("DB_NAME", "postgres")
    SOURCE_TABLE: str = os.getenv("SOURCE_TABLE", "test_data")

    # Target BigQuery Configuration
    GCP_PROJECT: str = os.getenv("GCP_PROJECT", "upbeat-repeater-477110-q6")
    BQ_DATASET: str = os.getenv("BQ_DATASET", "analytics")
    BQ_TARGET_TABLE: str = os.getenv("BQ_TARGET_TABLE", "postgres_test2")
    BQ_WRITE_DISPOSITION: str = os.getenv("BQ_WRITE_DISPOSITION", "WRITE_TRUNCATE")


settings = Settings()
