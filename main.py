"""Main ETL entrypoint for Cloud Run Job."""
import json
import logging
import os
import sys
from datetime import datetime, timezone

from src.ingestion.gcs_reader import GCSReader
from src.transformation.cleaner import DataCleaner
from src.transformation.deduplicator import Deduplicator
from src.loader.bigquery_writer import BigQueryWriter

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "module": "%(name)s", "message": "%(message)s"}',
)
logger = logging.getLogger("SalesOrderETL")


def run_pipeline() -> dict:
    """Executes the full Sales Order ETL batch pipeline.

    Returns:
        dict: Summary metrics of the pipeline execution
    """
    project_id = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT") or "upbeat-repeater-477110-q6"
    gcs_bucket = os.getenv("GCS_BUCKET_NAME", "sdlc-workspec-store")
    gcs_file_path = os.getenv("GCS_FILE_PATH", "etl/data/raw_sales_data.csv")
    bq_dataset = os.getenv("BIGQUERY_DATASET", "analytics")
    bq_table = os.getenv("BIGQUERY_TABLE", "harshada-test1")

    logger.info("Starting Sales Order ETL batch job...")
    logger.info(
        "Config: Project=%s, Source=gs://%s/%s, Target=%s.%s",
        project_id,
        gcs_bucket,
        gcs_file_path,
        bq_dataset,
        bq_table,
    )

    execution_timestamp = datetime.now(timezone.utc)

    # 1. Extraction from GCS
    reader = GCSReader()
    raw_df = reader.read_csv(bucket_name=gcs_bucket, blob_name=gcs_file_path)
    rows_read = len(raw_df)
    logger.info("Step 1 (Extract): Read %d raw rows from GCS.", rows_read)

    # 2. Transformation / Cleaning
    cleaned_df = DataCleaner.clean(raw_df, execution_time=execution_timestamp)
    rows_cleaned = len(cleaned_df)
    logger.info("Step 2 (Clean): Sanitized %d rows.", rows_cleaned)

    # 3. Deduplication
    deduped_df = Deduplicator.deduplicate(cleaned_df, key_column="order_id")
    rows_deduped = len(deduped_df)
    logger.info("Step 3 (Deduplicate): Retained %d unique orders.", rows_deduped)

    # 4. BigQuery Load
    writer = BigQueryWriter(project_id=project_id)
    rows_loaded = writer.write_dataframe(
        df=deduped_df,
        dataset_id=bq_dataset,
        table_id=bq_table,
        partition_field="order_date",
    )
    logger.info("Step 4 (Load): Loaded %d rows into BigQuery %s.%s", rows_loaded, bq_dataset, bq_table)

    summary = {
        "execution_status": "SUCCESS",
        "execution_timestamp": execution_timestamp.isoformat(),
        "rows_read": rows_read,
        "rows_cleaned": rows_cleaned,
        "rows_deduplicated": rows_deduped,
        "rows_loaded": rows_loaded,
    }
    logger.info("ETL Summary: %s", json.dumps(summary))
    return summary


def main():
    """CLI / Container Entrypoint."""
    try:
        summary = run_pipeline()
        print(json.dumps(summary, indent=2))
        sys.exit(0)
    except Exception as exc:
        logger.error("Fatal error during ETL execution: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
