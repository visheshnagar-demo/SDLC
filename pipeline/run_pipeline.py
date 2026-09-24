import os
import sys
import time
from datetime import datetime, timezone
from pipeline.cleaner import clean_dataframe
from pipeline.extractor import extract_data
from pipeline.loader import load_dataframe_to_bigquery
from pipeline.logger import get_logger

logger = get_logger("run_pipeline")


def run_etl_pipeline() -> dict:
    """Executes the end-to-end Cloud SQL to BigQuery ETL pipeline."""
    start_time = time.time()
    job_id = f"job_{int(start_time)}"

    source_table = os.getenv("SOURCE_TABLE", "test_data")
    gcp_project = os.getenv("GCP_PROJECT", "upbeat-repeater-477110-q6")
    bq_dataset = os.getenv("BQ_DATASET", "analytics")
    bq_table = os.getenv("BQ_TABLE", "postgres_test3")

    logger.info(
        f"Starting ETL Job '{job_id}' from Cloud SQL table '{source_table}' to BigQuery '{gcp_project}.{bq_dataset}.{bq_table}'"
    )

    try:
        # Step 1: Extraction
        raw_df = extract_data(table_name=source_table)
        extracted_count = len(raw_df)

        # Step 2: Transformation & Cleaning
        cleaned_df, metrics = clean_dataframe(raw_df, primary_key="id")
        cleaned_count = len(cleaned_df)

        # Step 3: BigQuery Load
        loaded_count = load_dataframe_to_bigquery(
            cleaned_df,
            project_id=gcp_project,
            dataset_id=bq_dataset,
            table_id=bq_table,
        )

        elapsed = time.time() - start_time
        summary = {
            "job_id": job_id,
            "status": "SUCCESS",
            "source_table": source_table,
            "target_table": f"{gcp_project}.{bq_dataset}.{bq_table}",
            "extracted_rows": extracted_count,
            "cleaned_rows": cleaned_count,
            "loaded_rows": loaded_count,
            "duplicates_dropped": metrics.get("dropped_duplicates", 0),
            "duration_seconds": round(elapsed, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        logger.info(f"ETL Job '{job_id}' completed successfully: {summary}")
        return summary

    except Exception as exc:
        elapsed = time.time() - start_time
        logger.error(f"ETL Job '{job_id}' failed after {round(elapsed, 2)}s: {exc}")
        raise


def main():
    try:
        run_etl_pipeline()
        sys.exit(0)
    except Exception as exc:
        logger.critical(f"Pipeline execution fatal error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
