"""GCS Extractor module for test04 ETL pipeline."""
import io
import os
import urllib.parse
import logging

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import storage
except ImportError:
    storage = None

logger = logging.getLogger("test04_etl.extractor")


class GCSExtractor:
    """Extracts CSV data from Google Cloud Storage."""

    def __init__(self, bucket_name: str = None, source_prefix: str = None):
        self.bucket_name = bucket_name or os.getenv("GCS_SOURCE_BUCKET", "sdlc-workspec-store")
        self.source_prefix = source_prefix or os.getenv("GCS_SOURCE_PREFIX", "etl/data/my_file (1).csv")
        # Handle URL encoded characters in prefix if present
        if "%" in self.source_prefix:
            self.source_prefix = urllib.parse.unquote(self.source_prefix)

    def extract(self) -> "pd.DataFrame":
        """Extracts CSV data from GCS bucket and returns a DataFrame.

        Zero-mock policy: Raises FileNotFoundError or RuntimeError on failure.
        """
        if pd is None:
            raise RuntimeError("FATAL: pandas is required for pipeline execution.")
        if storage is None:
            raise RuntimeError("FATAL: google-cloud-storage is required for GCS extraction.")
        if not self.bucket_name:
            raise EnvironmentError("FATAL: GCS source bucket not configured. Set GCS_SOURCE_BUCKET.")
        if not self.source_prefix:
            raise EnvironmentError("FATAL: GCS source prefix not configured. Set GCS_SOURCE_PREFIX.")

        logger.info("Connecting to GCS to extract gs://%s/%s", self.bucket_name, self.source_prefix)
        client = storage.Client()
        bucket = client.bucket(self.bucket_name)

        blob = bucket.blob(self.source_prefix)
        if not blob.exists():
            # Try searching with prefix matching in case of slight path variations
            matching_blobs = [b for b in bucket.list_blobs(prefix=self.source_prefix) if not b.name.endswith("/")]
            if not matching_blobs:
                raise FileNotFoundError(
                    f"FATAL: Source object gs://{self.bucket_name}/{self.source_prefix} does not exist."
                )
            blob = matching_blobs[0]

        logger.info("Downloading blob: %s (size: %s bytes)", blob.name, blob.size)
        content_bytes = blob.download_as_bytes()
        if not content_bytes:
            raise ValueError(f"FATAL: Extracted 0 bytes from gs://{self.bucket_name}/{blob.name}")

        df = pd.read_csv(io.BytesIO(content_bytes))
        logger.info("Extracted %d rows and %d columns from GCS CSV.", len(df), len(df.columns))
        return df
