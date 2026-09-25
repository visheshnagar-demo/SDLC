"""ETL Pipeline Execution Orchestration.
Integrates Extractor, Transformer, and Loader with structured metrics logging.
"""
import json
import logging
import sys
import time
from typing import Dict, Any, Optional
from server.etl.config import Settings, get_settings
from server.etl.extractor import extract_postgres_data
from server.etl.transformer import transform_and_clean_data
from server.etl.loader import load_data_to_bigquery

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("server.etl.pipeline")


def run_etl_pipeline(settings: Optional[Settings] = None) -> Dict[str, Any]:
    """Runs the end-to-end Cloud SQL to BigQuery ETL pipeline."""
    if settings is None:
        settings = get_settings()

    start_time = time.time()
    logger.info("=== Starting ETL Pipeline Execution (SCRUM-392) ===")
    logger.info("Source Table: %s | Target: %s.%s", settings.source_table, settings.bigquery_dataset, settings.bigquery_table)

    try:
        # Step 1: Extraction
        raw_df = extract_postgres_data(settings)
        extracted_count = len(raw_df)
        logger.info("Extracted %d records from source PostgreSQL table.", extracted_count)

        # Step 2: Transformation
        clean_df = transform_and_clean_data(raw_df)
        cleaned_count = len(clean_df)
        logger.info("Cleaned %d records after validation and transformation.", cleaned_count)

        # Step 3: Loading
        loaded_count = load_data_to_bigquery(clean_df, settings)
        logger.info("Loaded %d records into BigQuery target table.", loaded_count)

        duration = round(time.time() - start_time, 2)
        summary = {
            "status": "SUCCESS",
            "source_table": settings.source_table,
            "target_table": f"{settings.bigquery_dataset}.{settings.bigquery_table}",
            "extracted_rows": extracted_count,
            "cleaned_rows": cleaned_count,
            "loaded_rows": loaded_count,
            "duration_seconds": duration,
        }
        logger.info("=== ETL Pipeline Succeeded === Metric Summary: %s", json.dumps(summary))
        return summary
    except Exception as exc:
        duration = round(time.time() - start_time, 2)
        logger.critical("ETL Pipeline FAILED after %.2fs: %s", duration, exc, exc_info=True)
        raise


if __name__ == "__main__":
    try:
        metrics = run_etl_pipeline()
        sys.exit(0)
    except Exception:
        sys.exit(1)
