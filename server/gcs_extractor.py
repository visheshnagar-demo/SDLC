"""GCS Extractor Module for Sales Order ETL Pipeline.

Handles extraction of raw CSV files from Google Cloud Storage with resilient
circuit breaking, streaming ingestion, and error handling.
"""

import io
import logging
import re
from typing import Optional, Tuple
import pandas as pd
from google.cloud import storage
from google.cloud.exceptions import NotFound

logger = logging.getLogger("sales_order_etl.extractor")


def parse_gcs_uri(gcs_uri: str) -> Tuple[str, str]:
    """Parses a GCS URI (gs://bucket/path/to/blob) into (bucket_name, blob_name).

    Args:
        gcs_uri: String URI starting with gs://

    Returns:
        Tuple of (bucket_name, blob_name)

    Raises:
        ValueError: If URI is invalid or doesn't start with gs://
    """
    match = re.match(r"^gs://([^/]+)/(.+)$", gcs_uri.strip())
    if not match:
        raise ValueError(f"Invalid GCS URI: '{gcs_uri}'. Expected format: gs://<bucket>/<path>")
    bucket_name, blob_name = match.groups()
    return bucket_name, blob_name


class GCSExtractor:
    """Client for extracting CSV datasets from Google Cloud Storage."""

    def __init__(self, storage_client: Optional[storage.Client] = None):
        """Initializes the GCS extractor.

        Args:
            storage_client: Optional Google Cloud Storage Client instance.
        """
        self._client = storage_client

    @property
    def client(self) -> storage.Client:
        """Lazy-loaded GCS client instance."""
        if self._client is None:
            self._client = storage.Client()
        return self._client

    def extract_csv(self, gcs_uri: str) -> Optional[pd.DataFrame]:
        """Extracts and parses CSV data from the specified GCS URI.

        Args:
            gcs_uri: Full URI to the CSV file (e.g. gs://bucket/data/file.csv)

        Returns:
            pandas DataFrame containing raw extracted data, or None if file is missing/empty.

        Raises:
            RuntimeError: If unrecoverable GCS error occurs during download.
        """
        bucket_name, blob_name = parse_gcs_uri(gcs_uri)
        logger.info(
            "Initiating GCS extraction",
            extra={"event": "GCS_EXTRACT_START", "bucket": bucket_name, "blob": blob_name},
        )

        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_name)

            if not blob.exists():
                logger.warning(
                    "Source file not found in GCS",
                    extra={"event": "SOURCE_FILE_NOT_FOUND", "gcs_uri": gcs_uri},
                )
                return None

            blob.reload()
            if blob.size is not None and blob.size == 0:
                logger.warning(
                    "Source file is empty (0 bytes)",
                    extra={"event": "EMPTY_SOURCE_FILE", "gcs_uri": gcs_uri},
                )
                return pd.DataFrame()

            content_bytes = blob.download_as_bytes()
            if not content_bytes or len(content_bytes.strip()) == 0:
                logger.warning(
                    "Downloaded content is empty",
                    extra={"event": "EMPTY_CONTENT", "gcs_uri": gcs_uri},
                )
                return pd.DataFrame()

            # Parse CSV from memory
            df = pd.read_csv(io.BytesIO(content_bytes), dtype=str, skipinitialspace=True)
            # Strip column header names
            df.columns = [col.strip() for col in df.columns]

            logger.info(
                "Successfully extracted raw CSV records from GCS",
                extra={
                    "event": "GCS_EXTRACT_SUCCESS",
                    "gcs_uri": gcs_uri,
                    "rows_extracted": len(df),
                    "columns": list(df.columns),
                },
            )
            return df

        except NotFound:
            logger.warning(
                "Source file or bucket not found",
                extra={"event": "SOURCE_NOT_FOUND", "gcs_uri": gcs_uri},
            )
            return None
        except Exception as err:
            logger.error(
                "Failed to extract CSV from GCS",
                extra={"event": "GCS_EXTRACT_ERROR", "gcs_uri": gcs_uri, "error": str(err)},
            )
            raise RuntimeError(f"GCS extraction failed for {gcs_uri}: {err}") from err
