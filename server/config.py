"""Configuration settings for the ETL pipeline."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AliasChoices


class PipelineConfig(BaseSettings):
    """Pipeline configuration loaded from environment or CLI."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True
    )

    source_gcs_uri: str = Field(
        default="gs://sdlc-workspec-store/etl/data/my_file (1).csv",
        validation_alias=AliasChoices("GCS_SOURCE_URI", "source_gcs_uri"),
        description="GCS URI for the source CSV file."
    )
    project_id: str = Field(
        default="upbeat-repeater-477110-q6",
        validation_alias=AliasChoices("GCP_PROJECT_ID", "project_id"),
        description="Target GCP Project ID."
    )
    dataset_id: str = Field(
        default="analytics",
        validation_alias=AliasChoices("BQ_DATASET_ID", "dataset_id"),
        description="Target BigQuery Dataset ID."
    )
    table_id: str = Field(
        default="kttest04",
        validation_alias=AliasChoices("BQ_TABLE_ID", "table_id"),
        description="Target BigQuery Table ID."
    )
    write_disposition: str = Field(
        default="WRITE_TRUNCATE",
        validation_alias=AliasChoices("WRITE_DISPOSITION", "write_disposition"),
        description="BigQuery Write Disposition (WRITE_TRUNCATE or WRITE_APPEND)."
    )
    max_retries: int = Field(
        default=3,
        validation_alias=AliasChoices("MAX_RETRIES", "max_retries"),
        description="Maximum retry attempts for GCS/BigQuery operations."
    )
    retry_delay_seconds: float = Field(
        default=2.0,
        validation_alias=AliasChoices("RETRY_DELAY_SECONDS", "retry_delay_seconds"),
        description="Initial delay in seconds for exponential backoff."
    )


def get_config() -> PipelineConfig:
    """Retrieve pipeline configuration instance."""
    return PipelineConfig()
