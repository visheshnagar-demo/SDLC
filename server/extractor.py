import io
import logging
from typing import Optional, Tuple
import pandas as pd
from google.cloud import storage
from google.cloud.exceptions import NotFound

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def parse_gcs_uri(gcs_uri: str) -> Tuple[str, str]:
    """Parse a gs:// URI into bucket and blob name."""
    if not gcs_uri.startswith("gs://"):
        raise ValueError(f"Invalid GCS URI: {gcs_uri}. Must start with 'gs://'")
    uri_without_prefix = gcs_uri[5:]
    parts = uri_without_prefix.split("/", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValueError(
            f"Invalid GCS URI format: {gcs_uri}. Expected gs://<bucket>/<blob_name>"
        )
    return parts[0], parts[1]


def extract_from_gcs(
    gcs_uri: str,
    storage_client: Optional[storage.Client] = None,
) -> pd.DataFrame:
    """
    Ingest a CSV file from Google Cloud Storage into a Pandas DataFrame.
    Gracefully handles missing files, empty files, or storage errors by returning
    an empty DataFrame and logging structured messages without crashing.
    """
    logger.info("Starting GCS CSV extraction from %s", gcs_uri)
    try:
        bucket_name, blob_name = parse_gcs_uri(gcs_uri)
    except ValueError as e:
        logger.error("Failed to parse GCS URI '%s': %s", gcs_uri, e)
        return pd.DataFrame()

    client = storage_client or storage.Client()
    try:
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        if not blob.exists():
            logger.warning("GCS file does not exist: %s", gcs_uri)
            return pd.DataFrame()

        content_bytes = blob.download_as_bytes()
        if not content_bytes or len(content_bytes.strip()) == 0:
            logger.warning("GCS file is empty: %s", gcs_uri)
            return pd.DataFrame()

        df = pd.read_csv(io.BytesIO(content_bytes))
        logger.info("Successfully extracted %d raw records from %s", len(df), gcs_uri)
        return df

    except NotFound:
        logger.warning("GCS resource not found: %s", gcs_uri)
        return pd.DataFrame()
    except Exception as e:
        logger.error(
            "Error during GCS extraction from %s: %s", gcs_uri, e, exc_info=True
        )
        return pd.DataFrame()


def extract_from_local_or_buffer(
    source: io.BytesIO | io.StringIO | str,
) -> pd.DataFrame:
    """Helper to extract from a local file path or stream buffer (useful for testing)."""
    try:
        if isinstance(source, (io.BytesIO, io.StringIO)):
            df = pd.read_csv(source)
        else:
            df = pd.read_csv(source)
        return df
    except Exception as e:
        logger.error("Error reading data source: %s", e)
        return pd.DataFrame()
