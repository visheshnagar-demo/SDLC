"""Data extractor module for fetching CSV files from Google Cloud Storage."""
import os
import io
import pandas as pd
from google.cloud import storage
from pipeline.config import PipelineConfig
from pipeline.logger import get_logger

logger = get_logger("extractor")


class GCSExtractor:
    """Extracts raw files from GCS bucket with fail-fast validation."""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.storage_client = storage.Client(project=self.config.gcp_project_id)

    def extract_to_dataframe(self) -> pd.DataFrame:
        """Extracts sales order CSV from GCS directly into a pandas DataFrame.

        Zero-mock policy: Raises FileNotFoundError / RuntimeError if source is unavailable.
        """
        logger.info(
            f"Fetching raw data from gs://{self.config.gcs_source_bucket}/{self.config.gcs_source_prefix}"
        )

        try:
            bucket = self.storage_client.bucket(self.config.gcs_source_bucket)
            blob = bucket.blob(self.config.gcs_source_prefix)

            if not blob.exists():
                # Check if it's a prefix containing multiple files
                blobs = [b for b in bucket.list_blobs(prefix=self.config.gcs_source_prefix) if not b.name.endswith("/")]
                if not blobs:
                    raise FileNotFoundError(
                        f"FATAL: Source object gs://{self.config.gcs_source_bucket}/{self.config.gcs_source_prefix} does not exist."
                    )
                dfs = []
                for b in blobs:
                    content_bytes = b.download_as_bytes()
                    if not content_bytes:
                        continue
                    if b.name.endswith(".csv"):
                        dfs.append(pd.read_csv(io.BytesIO(content_bytes)))
                    elif b.name.endswith(".parquet"):
                        dfs.append(pd.read_parquet(io.BytesIO(content_bytes)))
                if not dfs:
                    raise ValueError(f"FATAL: No non-empty data files found in gs://{self.config.gcs_source_bucket}/{self.config.gcs_source_prefix}")
                df = pd.concat(dfs, ignore_index=True)
            else:
                content_bytes = blob.download_as_bytes()
                if not content_bytes or len(content_bytes.strip()) == 0:
                    raise ValueError(
                        f"FATAL: GCS file gs://{self.config.gcs_source_bucket}/{self.config.gcs_source_prefix} is empty."
                    )
                df = pd.read_csv(io.BytesIO(content_bytes))

            row_count = len(df)
            logger.info(f"Successfully extracted {row_count} records from GCS.")
            return df

        except Exception as exc:
            logger.error(f"Failed to extract from GCS: {exc}")
            raise
