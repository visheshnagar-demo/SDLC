"""GCS Extractor Module for downloading raw data."""
import os
import logging
from typing import Optional

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import storage
except ImportError:
    storage = None

logger = logging.getLogger(__name__)


class GCSExtractor:
    """Extracts raw data files from Google Cloud Storage."""

    def __init__(self, bucket_name: Optional[str] = None, prefix: Optional[str] = None):
        self.bucket_name = bucket_name or os.getenv("GCS_SOURCE_BUCKET", "sdlc-workspec-store")
        self.prefix = prefix or os.getenv("GCS_SOURCE_PREFIX", "etl/data/my_file (1).csv")
        if not self.bucket_name:
            raise EnvironmentError("FATAL: GCS source bucket not configured. Set GCS_SOURCE_BUCKET.")

    def extract_to_dataframe(self):
        """Connects to GCS, downloads matching blobs, and returns concatenated DataFrame.

        Zero-mock policy: raises FileNotFoundError or RuntimeError if objects cannot be fetched.
        """
        if pd is None:
            raise RuntimeError("FATAL: pandas is required for pipeline execution.")
        if storage is None:
            raise RuntimeError("FATAL: google-cloud-storage is required for extraction.")

        logger.info("Extracting data from GCS bucket: gs://%s/%s", self.bucket_name, self.prefix)
        client = storage.Client()
        bucket = client.bucket(self.bucket_name)

        # Check single blob or prefix search
        blob = bucket.blob(self.prefix)
        blobs = []
        if blob.exists():
            blobs = [blob]
        else:
            blobs = [b for b in bucket.list_blobs(prefix=self.prefix) if not b.name.endswith("/")]

        if not blobs:
            raise FileNotFoundError(
                f"FATAL: No data files found in gs://{self.bucket_name}/{self.prefix}. Zero-mock fallback disabled."
            )

        dfs = []
        for b in blobs:
            logger.info("Downloading blob: %s (size: %s bytes)", b.name, b.size)
            content_bytes = b.download_as_bytes()
            if b.name.endswith(".parquet"):
                import io
                dfs.append(pd.read_parquet(io.BytesIO(content_bytes)))
            elif b.name.endswith(".json") or b.name.endswith(".jsonl"):
                import io
                dfs.append(pd.read_json(io.BytesIO(content_bytes), lines=True))
            else:
                import io
                dfs.append(pd.read_csv(io.BytesIO(content_bytes), encoding="utf-8"))

        if not dfs:
            raise FileNotFoundError(f"FATAL: No parseable data files downloaded from gs://{self.bucket_name}/{self.prefix}")

        combined_df = pd.concat(dfs, ignore_index=True)
        logger.info("Extracted %d records from GCS source.", len(combined_df))
        return combined_df
