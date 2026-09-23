"""Main standalone runner for Sales Order ETL Cloud Run Job."""
import os
import sys
import logging
from datetime import datetime, timezone

from pipeline.ingest import extract_raw_data
from pipeline.cleaner import clean_sales_data
from pipeline.deduplicator import deduplicate_sales_data
from pipeline.loader import load_to_bigquery

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("sales_etl_runner")

def run_pipeline() -> int:
    """Executes full ETL pipeline: Extract -> Clean -> Deduplicate -> Load."""
    logger.info("=== Starting Sales Order ETL Pipeline Execution ===")
    try:
        raw_df = extract_raw_data()
        if raw_df.empty:
            logger.warning("No records extracted from source.")
            return 0

        clean_df = clean_sales_data(raw_df)
        if clean_df.empty:
            logger.error("0 records survived data cleaning. Circuit breaker tripped.")
            sys.exit(1)

        deduped_df = deduplicate_sales_data(clean_df)

        # Add ingestion audit timestamp
        deduped_df["_ingested_at"] = datetime.now(timezone.utc)

        load_to_bigquery(deduped_df)
        logger.info("=== Sales Order ETL Pipeline Completed Successfully ===")
        return 0
    except Exception as exc:
        logger.critical("Pipeline execution FAILED: %s", exc, exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    sys.exit(run_pipeline())
