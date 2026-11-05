"""Extractor module for ingesting sales order CSV files from Google Cloud Storage."""

import io
import logging
from typing import Optional, Tuple
from urllib.parse import urlparse
import pandas as pd
from google.cloud import storage
from google.cloud.exceptions import NotFound, GoogleCloudError
from server.config import settings

logger = logging.getLogger(__name__)


def parse_gcs_uri(uri: str) -> Tuple[str, str]:
    """Parse a GCS URI into (bucket_name, blob_name).

    Args:
        uri: GCS URI in the format 'gs://bucket-name/path/to/file.csv'.

    Returns:
        Tuple of (bucket_name, blob_name).

    Raises:
        ValueError: If URI format is not a valid gs:// path.
    """
    if not uri.startswith("gs://"):
        raise ValueError(f"Invalid GCS URI: '{uri}'. Must start with 'gs://'")
    parsed = urlparse(uri)
    bucket_name = parsed.netloc
    blob_name = parsed.path.lstrip("/")
    if not bucket_name or not blob_name:
        raise ValueError(f"Invalid GCS URI: '{uri}'. Missing bucket or blob path.")
    return bucket_name, blob_name


class Extractor:
    """Handles extracting CSV files from Google Cloud Storage or local file paths."""

    def __init__(self, storage_client: Optional[storage.Client] = None):
        self._storage_client = storage_client

    @property
    def client(self) -> storage.Client:
        """Lazily initialize Google Cloud Storage client."""
        if self._storage_client is None:
            self._storage_client = storage.Client(project=settings.GCP_PROJECT)
        return self._storage_client

    def extract_from_gcs(self, gcs_uri: str) -> pd.DataFrame:
        """Download and parse a CSV file from Google Cloud Storage.

        Args:
            gcs_uri: GCS URI (e.g. 'gs://sdlc-workspec-store/etl/data/raw_sales_data.csv').

        Returns:
            Pandas DataFrame containing raw records, or empty DataFrame on missing/empty file.
        """
        logger.info("Extracting data from GCS URI: %s", gcs_uri)
        try:
            bucket_name, blob_name = parse_gcs_uri(gcs_uri)
        except ValueError as e:
            logger.error("Failed to parse GCS URI '%s': %s", gcs_uri, e)
            return pd.DataFrame()

        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            if not blob.exists():
                logger.warning(
                    "GCS blob does not exist: bucket='%s', blob='%s'",
                    bucket_name,
                    blob_name,
                )
                return pd.DataFrame()

            content_bytes = blob.download_as_bytes()
            if not content_bytes or len(content_bytes.strip()) == 0:
                logger.warning("GCS blob is empty: %s", gcs_uri)
                return pd.DataFrame()

            df = pd.read_csv(io.BytesIO(content_bytes))
            logger.info(
                "Successfully extracted %d raw records from %s", len(df), gcs_uri
            )
            return df

        except NotFound as e:
            logger.warning("GCS resource not found for URI '%s': %s", gcs_uri, e)
            return pd.DataFrame()
        except pd.errors.EmptyDataError:
            logger.warning(
                "GCS CSV file at '%s' is empty or contains no data.", gcs_uri
            )
            return pd.DataFrame()
        except GoogleCloudError as e:
            logger.error(
                "Google Cloud Storage error during extraction from '%s': %s", gcs_uri, e
            )
            return pd.DataFrame()
        except Exception as e:
            logger.error(
                "Unexpected error extracting from '%s': %s", gcs_uri, e, exc_info=True
            )
            return pd.DataFrame()

    def extract(self, source_path_or_uri: Optional[str] = None) -> pd.DataFrame:
        """Extract data from GCS URI or local path.

        Args:
            source_path_or_uri: GCS URI or local file path. Defaults to settings.GCS_SOURCE_URI.

        Returns:
            Extracted Pandas DataFrame.
        """
        uri = source_path_or_uri or settings.GCS_SOURCE_URI
        if uri.startswith("gs://"):
            return self.extract_from_gcs(uri)

        # Local file path fallback (useful for testing and development)
        logger.info("Extracting data from local path: %s", uri)
        try:
            local_path = uri.replace("file://", "")
            df = pd.read_csv(local_path)
            logger.info(
                "Successfully extracted %d records from local path %s", len(df), uri
            )
            return df
        except FileNotFoundError:
            logger.warning("Local file not found: %s", uri)
            return pd.DataFrame()
        except pd.errors.EmptyDataError:
            logger.warning("Local file is empty: %s", uri)
            return pd.DataFrame()
        except Exception as e:
            logger.error("Error reading local file '%s': %s", uri, e, exc_info=True)
            return pd.DataFrame()
