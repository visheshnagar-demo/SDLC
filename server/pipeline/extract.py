"""GCS Extraction Module for ETL Pipeline."""

import csv
import io
import os
from typing import Any, Optional, Union
from urllib.parse import unquote, urlparse
from server.pipeline.observability import structured_logger

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None

try:
    from google.cloud import storage
    HAS_STORAGE = True
except ImportError:
    HAS_STORAGE = False
    storage = None


def extract_from_gcs(
    gcs_uri: str,
    storage_client: Optional[Any] = None,
) -> Any:
    """
    Extract CSV dataset from Google Cloud Storage into a Pandas DataFrame or list of dicts.

    Args:
        gcs_uri: GCS URI (e.g. 'gs://sdlc-workspec-store/etl/data/my_file (1).csv')
        storage_client: Optional pre-configured storage.Client instance

    Returns:
        pd.DataFrame (if pandas available) or list of dicts containing extracted raw records.

    Raises:
        FileNotFoundError: If blob or file does not exist.
        ValueError: If URI format is invalid.
        RuntimeError: If download fails or content is empty.
    """
    structured_logger.info("Starting extraction from GCS", {"source_uri": gcs_uri})

    # Support local filesystem paths for testing
    if os.path.exists(gcs_uri) or (not gcs_uri.startswith("gs://") and os.path.isfile(gcs_uri)):
        structured_logger.info(f"Reading from local path: {gcs_uri}")
        with open(gcs_uri, "r", encoding="utf-8") as f:
            content_str = f.read()
        return _parse_csv_content(content_str, gcs_uri)

    if not gcs_uri.startswith("gs://"):
        raise ValueError(f"Invalid GCS URI format: '{gcs_uri}'. Expected 'gs://<bucket>/<path>'")

    parsed = urlparse(gcs_uri)
    bucket_name = parsed.netloc
    blob_name = unquote(parsed.path.lstrip("/"))

    if not bucket_name or not blob_name:
        raise ValueError(f"Cannot extract bucket and blob from URI: '{gcs_uri}'")

    try:
        if storage_client is not None:
            client = storage_client
        elif HAS_STORAGE and storage is not None:
            client = storage.Client()
        else:
            raise RuntimeError("google-cloud-storage library is not installed and no mock client provided.")

        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        if hasattr(blob, "exists") and not blob.exists(client):
            error_msg = f"GCS blob not found at '{gcs_uri}' (Bucket: '{bucket_name}', Blob: '{blob_name}')"
            structured_logger.error(error_msg)
            raise FileNotFoundError(error_msg)

        content_bytes = blob.download_as_bytes()
        if not content_bytes or len(content_bytes.strip()) == 0:
            error_msg = f"GCS blob '{gcs_uri}' is empty (0 bytes)."
            structured_logger.error(error_msg)
            raise RuntimeError(error_msg)

        content_str = content_bytes.decode("utf-8", errors="replace")
        return _parse_csv_content(content_str, gcs_uri)

    except FileNotFoundError:
        raise
    except RuntimeError:
        raise
    except Exception as exc:
        error_msg = f"Failed to extract GCS object from '{gcs_uri}': {str(exc)}"
        structured_logger.error(error_msg, exc_info=True)
        raise RuntimeError(error_msg) from exc


def _parse_csv_content(content_str: str, source_label: str) -> Any:
    """Helper to parse CSV string into DataFrame or list of dicts."""
    if not content_str or not content_str.strip():
        error_msg = f"Source dataset from '{source_label}' is empty (0 bytes)."
        structured_logger.error(error_msg)
        raise RuntimeError(error_msg)

    if HAS_PANDAS and pd is not None:
        df = pd.read_csv(io.StringIO(content_str), dtype=str)
        if df.empty:
            error_msg = f"Extracted dataset from '{source_label}' contains 0 records."
            structured_logger.error(error_msg)
            raise RuntimeError(error_msg)
        structured_logger.info(
            "Extraction completed successfully",
            {"source_uri": source_label, "rows_extracted": len(df)},
        )
        return df
    else:
        reader = csv.DictReader(io.StringIO(content_str))
        rows = list(reader)
        if not rows:
            error_msg = f"Extracted dataset from '{source_label}' contains 0 records."
            structured_logger.error(error_msg)
            raise RuntimeError(error_msg)
        structured_logger.info(
            "Extraction completed successfully (fallback dict)",
            {"source_uri": source_label, "rows_extracted": len(rows)},
        )
        return rows
