"""Pipeline Ingestor Module.

Handles downloading and parsing raw CSV files from Google Cloud Storage.
"""
import io
import os
import pandas as pd
from google.cloud import storage
from pipeline.logger import get_logger

logger = get_logger("sales_etl.ingestor")


class GCSIngestor:
    """Ingests raw sales data CSV from Google Cloud Storage or local file."""

    def __init__(self, bucket_name: str = None, source_prefix: str = None):
        self.bucket_name = (
            bucket_name
            or os.getenv("GCS_SOURCE_BUCKET")
            or "sdlc-workspec-store"
        )
        self.source_prefix = (
            source_prefix
            or os.getenv("GCS_SOURCE_PREFIX")
            or "etl/data/raw_sales_data.csv"
        )

    def fetch_data(self, source_override: str = None) -> pd.DataFrame:
        """Downloads CSV from GCS or reads local override file."""
        if source_override and os.path.exists(source_override):
            logger.info("Reading source data from local file: %s", source_override)
            df = pd.read_csv(source_override)
            logger.info("Successfully read %d rows from %s", len(df), source_override)
            return df

        if not self.bucket_name:
            raise EnvironmentError("FATAL: GCS source bucket not configured.")

        gcs_uri = f"gs://{self.bucket_name}/{self.source_prefix}"
        logger.info("Fetching raw CSV data from GCS URI: %s", gcs_uri)

        try:
            client = storage.Client()
            bucket = client.bucket(self.bucket_name)
            blob = bucket.blob(self.source_prefix)

            if not blob.exists():
                # Check if source_prefix matches multiple blobs (directory style)
                blobs = list(bucket.list_blobs(prefix=self.source_prefix))
                valid_blobs = [b for b in blobs if not b.name.endswith("/")]
                if not valid_blobs:
                    raise FileNotFoundError(
                        f"FATAL: Source blob {gcs_uri} does not exist in GCS bucket."
                    )
                dfs = []
                for b in valid_blobs:
                    content = b.download_as_bytes()
                    if b.name.endswith(".csv"):
                        dfs.append(pd.read_csv(io.BytesIO(content)))
                    elif b.name.endswith(".parquet"):
                        dfs.append(pd.read_parquet(io.BytesIO(content)))
                if not dfs:
                    raise FileNotFoundError(f"FATAL: No parseable files found under {gcs_uri}")
                df = pd.concat(dfs, ignore_index=True)
            else:
                content = blob.download_as_bytes()
                if len(content) == 0:
                    raise ValueError(f"FATAL: Source GCS object {gcs_uri} is 0 bytes.")
                df = pd.read_csv(io.BytesIO(content))

            logger.info("Successfully ingested %d records from %s", len(df), gcs_uri)
            return df
        except Exception as exc:
            logger.error("Failed to fetch data from GCS (%s): %s", gcs_uri, exc)
            raise
