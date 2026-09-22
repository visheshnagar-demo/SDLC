"""Standalone Connector Pipeline Runner: sales_order_etl
Integrates modular GCSReader, DataCleaner, Deduplicator, and BigQueryWriter.
"""
import os
import sys
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("sales_order_etl")

from src.ingestion.gcs_reader import GCSReader
from src.transformation.cleaner import DataCleaner
from src.transformation.deduplicator import Deduplicator
from src.loader.bigquery_writer import BigQueryWriter


def run_etl():
    bucket_name = os.getenv("GCS_SOURCE_BUCKET") or "sdlc-workspec-store"
    blob_name = os.getenv("GCS_SOURCE_PREFIX") or "etl/data/raw_sales_data.csv"
    project_id = os.getenv("GCP_PROJECT_ID") or os.getenv("GCP_PROJECT") or "upbeat-repeater-477110-q6"
    dataset_id = os.getenv("BIGQUERY_DATASET") or "analytics"
    table_id = os.getenv("BIGQUERY_TABLE") or "harshada-test1"

    gcs_uri = f"gs://{bucket_name}/{blob_name}"
    logger.info("Starting ETL execution: %s -> %s.%s.%s", gcs_uri, project_id, dataset_id, table_id)

    reader = GCSReader()
    df_raw = reader.read_csv(gcs_uri=gcs_uri)
    logger.info("Ingested %d raw records from GCS", len(df_raw))

    df_clean = DataCleaner.clean(df_raw)
    logger.info("Cleaned %d records", len(df_clean))

    df_deduped = Deduplicator.deduplicate(df_clean, key_column="order_id")
    logger.info("Deduplicated records: %d unique rows", len(df_deduped))

    writer = BigQueryWriter(project_id=project_id)
    loaded_rows = writer.write_dataframe(
        df=df_deduped,
        dataset_id=dataset_id,
        table_id=table_id,
        partition_field="order_date",
    )
    logger.info("Successfully loaded %d records into BigQuery %s.%s.%s", loaded_rows, project_id, dataset_id, table_id)
    return loaded_rows


if __name__ == "__main__":
    try:
        run_etl()
        sys.exit(0)
    except Exception as exc:
        logger.critical("ETL Job execution FAILED: %s", exc, exc_info=True)
        sys.exit(1)
