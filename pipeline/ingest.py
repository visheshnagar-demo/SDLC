"""Ingestion module for loading CSV data from GCS or local path."""
import os
import logging

logger = logging.getLogger(__name__)

def extract_raw_data(source_path: str = None):
    """Extracts raw sales CSV data from GCS or local file path."""
    import pandas as pd
    from google.cloud import storage

    if not source_path:
        source_path = os.getenv("GCS_SOURCE_PATH", "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv")

    logger.info("Extracting raw data from: %s", source_path)

    if source_path.startswith("gs://"):
        path_parts = source_path[5:].split("/", 1)
        bucket_name = path_parts[0]
        blob_path = path_parts[1] if len(path_parts) > 1 else ""

        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_path)

        if not blob.exists():
            raise FileNotFoundError(f"FATAL: Source blob gs://{bucket_name}/{blob_path} does not exist.")

        local_tmp = "/tmp/raw_sales.csv" if os.name != "nt" else os.path.join(os.getenv("TEMP", "."), "raw_sales.csv")
        blob.download_to_filename(local_tmp)
        df = pd.read_csv(local_tmp)
    else:
        if not os.path.exists(source_path):
            raise FileNotFoundError(f"FATAL: Local source path {source_path} does not exist.")
        df = pd.read_csv(source_path)

    logger.info("Successfully extracted %d records", len(df))
    return df
