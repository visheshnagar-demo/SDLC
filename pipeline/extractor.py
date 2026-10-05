"""GCS Extraction Module for Sales ETL Pipeline.

Extracts sales order CSV files from Google Cloud Storage.
Zero-mock policy: raises explicit exceptions when sources are unavailable.
"""
import io
import os
import logging
from typing import Optional
import pandas as pd
from google.cloud import storage

logger = logging.getLogger("sales_etl.extractor")


class GCSExtractor:
    """Extracts raw sales data files from Google Cloud Storage."""

    def __init__(
        self,
        bucket_name: Optional[str] = None,
        source_prefix: Optional[str] = None,
        project_id: Optional[str] = None,
    ):
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
        self.project_id = (
            project_id
            or os.getenv("GCP_PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or "upbeat-repeater-477110-q6"
        )
        if not self.bucket_name:
            raise EnvironmentError("FATAL: GCS source bucket not configured. Set GCS_SOURCE_BUCKET.")

    def extract_to_dataframe(self) -> pd.DataFrame:
        """Extracts sales CSV from GCS and returns as a pandas DataFrame.

        Returns:
            pd.DataFrame: Raw extracted data.

        Raises:
            FileNotFoundError: If the specified file/prefix does not exist.
            RuntimeError: If GCS download or parsing fails.
        """
        logger.info(
            "Extracting raw data from GCS bucket: gs://%s/%s (Project: %s)",
            self.bucket_name,
            self.source_prefix,
            self.project_id,
        )

        try:
            client = storage.Client(project=self.project_id)
            bucket = client.bucket(self.bucket_name)
        except Exception as auth_err:
            raise RuntimeError(f"FATAL: Failed to initialize GCS storage client: {auth_err}") from auth_err

        # Check if source_prefix is a single blob
        blob = bucket.blob(self.source_prefix)
        if blob.exists():
            logger.info("Found direct blob: gs://%s/%s", self.bucket_name, self.source_prefix)
            content_bytes = blob.download_as_bytes()
            if not content_bytes:
                raise FileNotFoundError(
                    f"FATAL: Blob gs://{self.bucket_name}/{self.source_prefix} is empty (0 bytes)."
                )
            df = pd.read_csv(io.BytesIO(content_bytes))
            logger.info("Extracted %d raw records from single blob.", len(df))
            return df

        # Otherwise list blobs under prefix
        blobs = [b for b in bucket.list_blobs(prefix=self.source_prefix) if not b.name.endswith("/")]
        if not blobs:
            raise FileNotFoundError(
                f"FATAL: No data files found in gs://{self.bucket_name}/{self.source_prefix}. "
                "Mock fallback is disabled."
            )

        dfs = []
        for b in blobs:
            logger.info("Downloading blob: %s", b.name)
            raw_bytes = b.download_as_bytes()
            if not raw_bytes:
                continue
            if b.name.endswith(".parquet"):
                dfs.append(pd.read_parquet(io.BytesIO(raw_bytes)))
            elif b.name.endswith(".csv"):
                dfs.append(pd.read_csv(io.BytesIO(raw_bytes)))
            elif b.name.endswith(".json") or b.name.endswith(".jsonl"):
                dfs.append(pd.read_json(io.BytesIO(raw_bytes), lines=True))

        if not dfs:
            raise FileNotFoundError(
                f"FATAL: No parseable data files found under gs://{self.bucket_name}/{self.source_prefix}"
            )

        df = pd.concat(dfs, ignore_index=True)
        logger.info("Extracted %d raw records from %d blobs.", len(df), len(dfs))
        return df
