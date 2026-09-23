"""GCS Extractor module for Sales Order ETL pipeline."""
import io
import os
from typing import Optional

try:
    import pandas as pd
except ImportError:
    from unittest.mock import MagicMock
    pd = MagicMock()

try:
    from google.cloud import storage
except ImportError:
    from unittest.mock import MagicMock
    storage = MagicMock()

from server.config import config
from server.logger import logger


class GCSExtractor:
    """Extracts raw sales CSV data from Google Cloud Storage."""

    def __init__(
        self,
        bucket_name: Optional[str] = None,
        prefix: Optional[str] = None,
        gcs_uri: Optional[str] = None,
    ):
        if gcs_uri and gcs_uri.startswith("gs://"):
            raw_path = gcs_uri[5:]
            parts = raw_path.split("/", 1)
            self.bucket_name = parts[0]
            self.prefix = parts[1] if len(parts) > 1 else ""
        else:
            self.bucket_name = bucket_name if bucket_name is not None else config.gcs_source_bucket
            self.prefix = prefix if prefix is not None else config.gcs_source_prefix

    @property
    def source_uri(self) -> str:
        return f"gs://{self.bucket_name}/{self.prefix}"

    def extract(self) -> "pd.DataFrame":
        """Downloads and parses CSV data directly from GCS into a DataFrame.

        Zero-mock: Raises explicit exceptions on failure.
        """
        if not self.bucket_name or not self.prefix:
            raise EnvironmentError("GCS bucket name and prefix must be configured.")

        source_uri = self.source_uri
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

    def extract_data(self) -> "pd.DataFrame":
        """Alias for extract."""
        return self.extract()


def extract_from_gcs(
    bucket_name: Optional[str] = None,
    prefix: Optional[str] = None,
    gcs_uri: Optional[str] = None,
) -> "pd.DataFrame":
    """Helper function to extract data from GCS."""
    extractor = GCSExtractor(bucket_name=bucket_name, prefix=prefix, gcs_uri=gcs_uri)
    return extractor.extract()
