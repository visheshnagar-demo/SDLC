"""GCS Extractor module for Sales Order ETL pipeline."""
import io
import os
import pandas as pd
from google.cloud import storage
from server.config import config
from server.logger import logger


class GCSExtractor:
    """Extracts raw sales CSV data from Google Cloud Storage."""

    def __init__(self, bucket_name: str = None, prefix: str = None):
        self.bucket_name = bucket_name or config.gcs_source_bucket
        self.prefix = prefix or config.gcs_source_prefix

    def extract(self) -> pd.DataFrame:
        """Downloads and parses CSV data directly from GCS into a DataFrame.

        Zero-mock: Raises explicit exceptions on failure.
        """
        if not self.bucket_name or not self.prefix:
            raise EnvironmentError("GCS bucket name and prefix must be configured.")

        source_uri = f"gs://{self.bucket_name}/{self.prefix}"
        logger.info("Connecting to GCS to extract raw data from %s", source_uri)

        client = storage.Client()
        bucket = client.bucket(self.bucket_name)
        blob = bucket.blob(self.prefix)

        if not blob.exists():
            # If single file doesn't exist, check if prefix matches blobs
            blobs = [b for b in bucket.list_blobs(prefix=self.prefix) if not b.name.endswith("/")]
            if not blobs:
                raise FileNotFoundError(f"GCS source object not found at {source_uri}")
            dfs = []
            for b in blobs:
                content = b.download_as_bytes()
                if len(content) == 0:
                    continue
                if b.name.endswith(".csv"):
                    dfs.append(pd.read_csv(io.BytesIO(content)))
                elif b.name.endswith(".parquet"):
                    dfs.append(pd.read_parquet(io.BytesIO(content)))
            if not dfs:
                raise ValueError(f"No non-empty data files found in GCS prefix {source_uri}")
            df = pd.concat(dfs, ignore_index=True)
        else:
            content = blob.download_as_bytes()
            if len(content) == 0:
                raise ValueError(f"GCS source file {source_uri} is empty (0 bytes).")
            df = pd.read_csv(io.BytesIO(content))

        logger.info("Successfully extracted %d raw records from %s", len(df), source_uri)
        return df
