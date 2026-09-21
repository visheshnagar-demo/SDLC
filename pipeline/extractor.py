"""GCS Extractor module for reading CSV datasets from Google Cloud Storage."""
import os
import logging
from io import BytesIO
import pandas as pd
from google.cloud import storage

logger = logging.getLogger("pipeline.extractor")


class GCSExtractor:
    """Extracts CSV files from Google Cloud Storage into pandas DataFrames."""

    def __init__(self, gcs_uri: str = None, bucket_name: str = None, prefix: str = None):
        if gcs_uri and gcs_uri.startswith("gs://"):
            parts = gcs_uri[5:].split("/", 1)
            self.bucket_name = parts[0]
            self.prefix = parts[1] if len(parts) > 1 else ""
        elif gcs_uri and gcs_uri.startswith("https://storage.cloud.google.com/"):
            clean_uri = gcs_uri.replace("https://storage.cloud.google.com/", "").split("?")[0]
            parts = clean_uri.split("/", 1)
            self.bucket_name = parts[0]
            self.prefix = parts[1] if len(parts) > 1 else ""
        else:
            self.bucket_name = bucket_name or os.getenv("GCS_SOURCE_BUCKET", "sdlc-workspec-store")
            self.prefix = prefix or os.getenv("GCS_SOURCE_PREFIX", "etl/data/test_dynamic_etl_gmt.csv")

    def extract(self) -> pd.DataFrame:
        """Downloads and parses CSV data directly from GCS into a DataFrame.

        Zero-mock: If file or bucket is missing, raises FileNotFoundError or RuntimeError immediately.
        """
        logger.info("Extracting data from GCS gs://%s/%s", self.bucket_name, self.prefix)
        try:
            client = storage.Client()
            bucket = client.bucket(self.bucket_name)
            blob = bucket.blob(self.prefix)

            if not blob.exists():
                # Check if it's a directory / prefix
                blobs = [b for b in bucket.list_blobs(prefix=self.prefix) if not b.name.endswith("/")]
                if not blobs:
                    raise FileNotFoundError(
                        f"FATAL: Source file or prefix not found in GCS: gs://{self.bucket_name}/{self.prefix}"
                    )
                dfs = []
                for b in blobs:
                    content = b.download_as_bytes()
                    if b.name.endswith(".csv"):
                        dfs.append(pd.read_csv(BytesIO(content)))
                    elif b.name.endswith(".parquet"):
                        dfs.append(pd.read_parquet(BytesIO(content)))
                    elif b.name.endswith(".json") or b.name.endswith(".jsonl"):
                        dfs.append(pd.read_json(BytesIO(content), lines=True))
                if not dfs:
                    raise FileNotFoundError(f"FATAL: No parseable files found under prefix: {self.prefix}")
                df = pd.concat(dfs, ignore_index=True)
            else:
                content = blob.download_as_bytes()
                if self.prefix.endswith(".parquet"):
                    df = pd.read_parquet(BytesIO(content))
                elif self.prefix.endswith(".json") or self.prefix.endswith(".jsonl"):
                    df = pd.read_json(BytesIO(content), lines=True)
                else:
                    df = pd.read_csv(BytesIO(content))

            logger.info("Successfully extracted %d records from GCS.", len(df))
            return df
        except Exception as exc:
            logger.critical("Extraction from GCS failed: %s", exc, exc_info=True)
            raise
