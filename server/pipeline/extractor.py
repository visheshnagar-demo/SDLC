"""GCS Extractor module for downloading and parsing CSV files from Google Cloud Storage."""
import io
import logging
import re
from typing import Optional, Tuple
import pandas as pd
from google.cloud import storage
from google.cloud.exceptions import NotFound

logger = logging.getLogger("sales_orders_etl.extractor")


class GCSFileReader:
    """Extracts raw sales data CSV from Google Cloud Storage."""

    def __init__(self, client: Optional[storage.Client] = None):
        self._client = client

    @property
    def client(self) -> storage.Client:
        """Lazy load or return the Cloud Storage client."""
        if self._client is None:
            self._client = storage.Client()
        return self._client

    @staticmethod
    def parse_gcs_uri(gcs_uri: str) -> Tuple[str, str]:
        """Parses a gs://bucket/path/to/blob URI into (bucket_name, blob_name).

        Args:
            gcs_uri: Full URI (e.g. 'gs://sdlc-workspec-store/etl/data/raw_sales_data.csv').

        Returns:
            Tuple of (bucket_name, blob_name).

        Raises:
            ValueError: If URI format is invalid.
        """
        match = re.match(r"^gs://([^/]+)/(.+)$", gcs_uri.strip())
        if not match:
            raise ValueError(f"Invalid GCS URI format: '{gcs_uri}'. Expected 'gs://<bucket>/<object_key>'")
        return match.group(1), match.group(2)

    def extract_from_gcs(self, gcs_uri: str) -> pd.DataFrame:
        """Downloads a CSV file from GCS and loads it into a Pandas DataFrame.

        Args:
            gcs_uri: Full GCS URI (e.g. 'gs://sdlc-workspec-store/etl/data/raw_sales_data.csv').

        Returns:
            pd.DataFrame with raw extracted records.

        Raises:
            FileNotFoundError: If the GCS blob or bucket does not exist.
            RuntimeError: If download or parsing fails.
        """
        bucket_name, blob_name = self.parse_gcs_uri(gcs_uri)
        logger.info(f"Connecting to GCS bucket: '{bucket_name}', blob: '{blob_name}'")

        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_name)

            if not blob.exists():
                error_msg = f"CRITICAL: Source file not found at GCS URI: {gcs_uri}"
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)

            raw_bytes = blob.download_as_bytes()
            if not raw_bytes or len(raw_bytes.strip()) == 0:
                logger.warning(f"WARN: CSV file is empty at {gcs_uri}, 0 records extracted")
                return pd.DataFrame()

            df = pd.read_csv(io.BytesIO(raw_bytes), dtype=str)
            logger.info(f"Successfully extracted {len(df)} raw rows from {gcs_uri}")
            return df

        except NotFound as exc:
            error_msg = f"CRITICAL: GCS resource not found: {gcs_uri}. Error: {str(exc)}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg) from exc
        except Exception as exc:
            if isinstance(exc, FileNotFoundError):
                raise
            error_msg = f"Failed to extract CSV data from GCS URI: {gcs_uri}. Cause: {str(exc)}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from exc

    def extract_from_csv_data(self, csv_data: str) -> pd.DataFrame:
        """Parses CSV string data into a Pandas DataFrame (used for testing or in-memory feeds)."""
        if not csv_data.strip():
            return pd.DataFrame()
        return pd.read_csv(io.StringIO(csv_data), dtype=str)
