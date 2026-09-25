"""GCS Ingestion Module."""
import io
import logging
import pandas as pd
from google.cloud import storage

logger = logging.getLogger("etl.ingest")


def extract_sales_data_from_gcs(bucket_name: str, blob_path: str) -> pd.DataFrame:
    """Extracts raw sales order CSV data directly from Google Cloud Storage.
    
    Zero-mock policy: Raises FileNotFoundError or RuntimeError immediately if GCS file is missing or invalid.
    """
    logger.info("Connecting to GCS bucket '%s' to stream '%s'...", bucket_name, blob_path)
    try:
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
    except Exception as init_err:
        logger.critical("Failed to initialize GCS client or access bucket %s: %s", bucket_name, init_err)
        raise RuntimeError(f"GCS client access failure: {init_err}") from init_err

    if not blob.exists():
        logger.critical("FATAL: Source file gs://%s/%s does not exist.", bucket_name, blob_path)
        raise FileNotFoundError(f"GCS source blob gs://{bucket_name}/{blob_path} not found.")

    raw_bytes = blob.download_as_bytes()
    if not raw_bytes or len(raw_bytes.strip()) == 0:
        logger.critical("FATAL: Source file gs://%s/%s is empty (0 bytes).", bucket_name, blob_path)
        raise ValueError(f"GCS source blob gs://{bucket_name}/{blob_path} is empty.")

    try:
        df = pd.read_csv(io.BytesIO(raw_bytes), encoding="utf-8")
    except UnicodeDecodeError:
        logger.warning("UTF-8 decoding failed for gs://%s/%s; attempting ISO-8859-1 fallback.", bucket_name, blob_path)
        df = pd.read_csv(io.BytesIO(raw_bytes), encoding="iso-8859-1")

    logger.info("Successfully ingested %d raw rows from gs://%s/%s", len(df), bucket_name, blob_path)
    return df
