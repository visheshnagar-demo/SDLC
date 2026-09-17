"""Data extractor module for fetching raw CSV datasets from GCS."""

import csv
import io
import logging
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse

try:
    from google.cloud import storage
except ImportError:
    storage = None

logger = logging.getLogger("sales_etl.extractor")


def parse_gcs_uri(gcs_uri: str) -> Tuple[str, str]:
    """Parses gs://bucket/path into bucket and blob name.

    Args:
        gcs_uri: Full GCS URI (gs://bucket/path/to/file.csv)

    Returns:
        Tuple of (bucket_name, blob_name)
    """
    parsed = urlparse(gcs_uri)
    if parsed.scheme != "gs":
        raise ValueError(f"Invalid GCS URI scheme: {gcs_uri}. Expected 'gs://...'")
    bucket_name = parsed.netloc
    blob_name = parsed.path.lstrip("/")
    if not bucket_name or not blob_name:
        raise ValueError(f"Invalid GCS URI structure: {gcs_uri}")
    return bucket_name, blob_name


class GCSExtractor:
    """Extractor for retrieving files from Google Cloud Storage."""

    def __init__(self, storage_client: Any = None):
        """Initializes the GCS client.

        Args:
            storage_client: Optional pre-configured GCS client.
        """
        if storage_client is not None:
            self.client = storage_client
        elif storage is not None:
            self.client = storage.Client()
        else:
            self.client = None

    def extract_csv(self, gcs_uri: str) -> List[Dict[str, str]]:
        """Downloads and parses CSV data from GCS into a list of row dictionaries.

        Args:
            gcs_uri: GCS URI of the target CSV file.

        Returns:
            List of dicts containing raw sales data rows.

        Raises:
            FileNotFoundError: If the GCS blob does not exist.
            RuntimeError: If download fails or content is unparseable.
        """
        bucket_name, blob_name = parse_gcs_uri(gcs_uri)
        logger.info(f"Extracting CSV from bucket: {bucket_name}, blob: {blob_name}")

        if self.client is None:
            raise RuntimeError(
                "Google Cloud Storage client is not initialized and google-cloud-storage is not installed."
            )

        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            if not blob.exists():
                raise FileNotFoundError(f"Source file not found at {gcs_uri}")

            data_bytes = blob.download_as_bytes()
            if not data_bytes or len(data_bytes.strip()) == 0:
                logger.warning(f"File at {gcs_uri} is empty.")
                return []

            text_content = data_bytes.decode("utf-8")
            reader = csv.DictReader(io.StringIO(text_content))
            rows = [dict(row) for row in reader]
            logger.info(f"Successfully extracted {len(rows)} raw records from {gcs_uri}")
            return rows

        except FileNotFoundError:
            raise
        except Exception as err:
            logger.error(f"Failed to extract CSV from {gcs_uri}: {str(err)}", exc_info=True)
            raise RuntimeError(f"GCS extraction error for {gcs_uri}: {str(err)}") from err
