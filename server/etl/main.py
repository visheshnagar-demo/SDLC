"""ETL Pipeline Execution Orchestration."""
import os
import sys
import time
import uuid
import argparse
from typing import Dict, Any

from server.etl.logger import get_logger, ETLMetrics
from server.etl.extractor import extract_from_postgres
from server.etl.transformer import clean_and_transform_dataframe
from server.etl.loader import load_to_bigquery

logger = get_logger("etl_main")


def run_etl_pipeline(
    table_name: str = "test_data",
    schema_name: str = "public",
    dataset_id: str = "analytics",
    target_table: str = "test6",
    write_disposition: str = "WRITE_TRUNCATE",
    batch_size: int = 5000,
) -> Dict[str, Any]:
    """Executes the full Extract, Transform, Load lifecycle and returns execution metrics."""
    job_id = f"job-{uuid.uuid4().hex[:8]}"
    start_time = time.time()
    logger.info("Starting ETL Pipeline execution [Job ID: %s]", job_id)

    # 1. Extraction
    df_raw = extract_from_postgres(
        table_name=table_name,
        schema_name=schema_name,
        batch_size=batch_size,
    )
    rows_extracted = len(df_raw)

    # 2. Transformation & Cleaning
    df_clean, duplicates_dropped = clean_and_transform_dataframe(df_raw)
    rows_cleaned = len(df_clean)

    # Circuit Breaker Check
    if rows_extracted > 0 and rows_cleaned == 0:
        logger.error("FATAL: 100%% of extracted records were quarantined during transformation.")
        raise RuntimeError("Circuit breaker triggered: 0 rows survived transformation.")

    # 3. Loading
    rows_loaded = load_to_bigquery(
        df=df_clean,
        dataset_id=dataset_id,
        table_id=target_table,
        write_disposition=write_disposition,
    )

    duration = round(time.time() - start_time, 2)
    metrics = ETLMetrics(
        rows_extracted=rows_extracted,
        rows_cleaned=rows_cleaned,
        duplicates_dropped=duplicates_dropped,
        rows_loaded=rows_loaded,
        duration_seconds=duration,
    )

    logger.info("ETL execution completed successfully: %s", metrics.to_dict())
    return {
        "status": "SUCCESS",
        "job_id": job_id,
        "source": f"sdlc-etl-demo-db.postgre.{table_name}",
        "target": f"upbeat-repeater-477110-q6.{dataset_id}.{target_table}",
        "metrics": metrics.to_dict(),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Postgres to BigQuery ETL Runner")
    parser.add_argument("--source-table", default="test_data", help="Source PostgreSQL table")
    parser.add_argument("--target-dataset", default="analytics", help="Target BigQuery dataset")
    parser.add_argument("--target-table", default="test6", help="Target BigQuery table")
    parser.add_argument("--write-disposition", default="WRITE_TRUNCATE", help="Write disposition")
    args = parser.parse_args()

    try:
        result = run_etl_pipeline(
            table_name=args.source_table,
            dataset_id=args.target_dataset,
            target_table=args.target_table,
            write_disposition=args.write_disposition,
        )
        print(result)
        sys.exit(0)
    except Exception as err:
        logger.critical("ETL run failed: %s", err, exc_info=True)
        sys.exit(1)
