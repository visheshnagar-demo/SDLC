"""ETL Configuration settings."""
import os
from dataclasses import dataclass

@dataclass
class ETLConfig:
    source_gcs_uri: str = os.getenv(
        "SOURCE_GCS_URI",
        "gs://sdlc-workspec-store/etl/data/my_file (1).csv",
    )
    gcp_project: str = os.getenv("GCP_PROJECT_ID", os.getenv("PROJECT_ID", "upbeat-repeater-477110-q6"))
    target_dataset: str = os.getenv("TARGET_DATASET", "analytics")
    target_table: str = os.getenv("TARGET_TABLE", "gcs_transformed_data")
    deadletter_table: str = os.getenv("DEADLETTER_TABLE", "etl_deadletter_records")
    write_disposition: str = os.getenv("WRITE_DISPOSITION", "WRITE_APPEND")
    batch_size: int = int(os.getenv("BATCH_SIZE", "10000"))
    dry_run: bool = os.getenv("DRY_RUN", "false").lower() in ("true", "1", "yes")

config = ETLConfig()
