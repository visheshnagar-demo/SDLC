"""GCS Extractor Module for downloading CSV source datasets."""
import io
import logging
import os
import pandas as pd
from google.cloud import storage

logger = logging.getLogger("etl.extractor")


class GCSExtractor:
    def __init__(self, bucket_name: str = None, prefix: str = None):
        self.bucket_name = bucket_name or os.getenv("GCS_SOURCE_BUCKET", "sdlc-workspec-store")
        self.prefix = prefix or os.getenv("GCS_SOURCE_PREFIX", "etl/data/my_file (1).csv")

    def extract(self) -> pd.DataFrame:
        """Downloads CSV directly from GCS bucket and returns DataFrame.
        Zero-mock policy: raises explicit errors if GCS or file is inaccessible.
        """
        logger.info("Connecting to GCS bucket '%s' for prefix '%s'...", self.bucket_name, self.prefix)
        if not self.bucket_name:
            raise EnvironmentError("FATAL: GCS_SOURCE_BUCKET environment variable is missing.")

        client = storage.Client()
        bucket = client.bucket(self.bucket_name)
        blob = bucket.blob(self.prefix)

        if not blob.exists():
            # Check if matching blobs exist under prefix
            blobs = list(bucket.list_blobs(prefix=self.prefix))
            if not blobs:
                raise FileNotFoundError(f"FATAL: Source file gs://{self.bucket_name}/{self.prefix} not found.")
            blob = blobs[0]

        logger.info("Downloading blob gs://%s/%s (%d bytes)...", self.bucket_name, blob.name, blob.size or 0)
        content = blob.download_as_bytes()
        if not content:
            raise ValueError(f"FATAL: Source file gs://{self.bucket_name}/{blob.name} is empty (0 bytes).")

        df = pd.read_csv(io.BytesIO(content))
        logger.info("Extracted %d rows and %d columns from GCS CSV.", len(df), len(df.columns))
        return df
