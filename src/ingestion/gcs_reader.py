"""GCS Reader module for ingesting raw sales CSV files."""
import io
import logging
from typing import Optional
import pandas as pd
from google.cloud import storage

logger = logging.getLogger(__name__)


class GCSReader:
    """Reads raw CSV datasets from Google Cloud Storage."""

    def __init__(self, client: Optional[storage.Client] = None):
        """Initialize GCS Reader with optional pre-configured storage client."""
        self.client = client or storage.Client()

    def parse_gcs_uri(self, gcs_uri: str) -> tuple[str, str]:
        """Parses gs://bucket/path/to/file into (bucket_name, blob_name)."""
        if not gcs_uri.startswith("gs://"):
            raise ValueError(f"Invalid GCS URI: '{gcs_uri}'. Expected format 'gs://bucket/path/to/file'")
        path_without_prefix = gcs_uri[5:]
        parts = path_without_prefix.split("/", 1)
        if len(parts) < 2 or not parts[0] or not parts[1]:
            raise ValueError(f"Invalid GCS URI format: '{gcs_uri}'")
        return parts[0], parts[1]

    def read_csv(self, gcs_uri: Optional[str] = None, bucket_name: Optional[str] = None, blob_name: Optional[str] = None) -> pd.DataFrame:
        """Downloads and loads CSV from GCS into a pandas DataFrame.

        Args:
            gcs_uri: Full URI (e.g. gs://bucket/path/file.csv)
            bucket_name: Name of the GCS bucket (if gcs_uri not provided)
            blob_name: Blob path inside the bucket (if gcs_uri not provided)

        Returns:
            pd.DataFrame: Ingested raw dataset

        Raises:
            FileNotFoundError: If the bucket or blob does not exist
            ValueError: If URI or parameters are invalid or file is empty
            RuntimeError: If download fails
        """
        if gcs_uri:
            bucket_name, blob_name = self.parse_gcs_uri(gcs_uri)
        elif not bucket_name or not blob_name:
            raise ValueError("Either gcs_uri or both bucket_name and blob_name must be supplied.")

        logger.info("Fetching blob '%s' from bucket '%s'", blob_name, bucket_name)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        if not blob.exists():
            raise FileNotFoundError(f"Blob 'gs://{bucket_name}/{blob_name}' does not exist.")

        raw_bytes = blob.download_as_bytes()
        if not raw_bytes or len(raw_bytes.strip()) == 0:
            raise ValueError(f"Blob 'gs://{bucket_name}/{blob_name}' is empty.")

        try:
            df = pd.read_csv(io.BytesIO(raw_bytes))
        except Exception as exc:
            raise RuntimeError(f"Failed to parse CSV data from gs://{bucket_name}/{blob_name}: {exc}") from exc

        if df.empty:
            raise ValueError(f"Parsed CSV from gs://{bucket_name}/{blob_name} contains 0 rows.")

        logger.info("Successfully ingested %d rows from gs://%s/%s", len(df), bucket_name, blob_name)
        return df
