"""Main Entry Point for Daily Batch Sales Orders ETL Cloud Run Job."""
import json
import logging
import sys
import time
from pipeline.extractor import SalesDataExtractor
from pipeline.transformer import SalesDataTransformer
from pipeline.loader import BigQuerySalesLoader

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","message":"%(message)s"}',
)
logger = logging.getLogger("etl_job")

def run_etl_pipeline() -> dict:
    start_time = time.time()
    logger.info("Starting Daily Batch Sales Orders ETL Pipeline")
    extractor = SalesDataExtractor()
    raw_df = extractor.extract()
    raw_count = len(raw_df) if raw_df is not None else 0
    transformer = SalesDataTransformer()
    clean_df = transformer.transform(raw_df)
    loader = BigQuerySalesLoader()
    loaded_count = loader.load(clean_df)
    duration = round(time.time() - start_time, 2)
    summary = {
        "event": "etl_job_summary",
        "job_id": "SCRUM-303-sales-orders-etl",
        "status": "SUCCESS",
        "source_file": f"gs://{extractor.bucket}/{extractor.blob}",
        "destination_table": f"{loader.dataset_id}.{loader.table_id}",
        "raw_records": raw_count,
        "cleaned_records": transformer.cleaned_count,
        "deduplicated_records": transformer.deduplicated_count,
        "quarantined_records": transformer.quarantined_count,
        "records_loaded": loaded_count,
        "duration_seconds": duration,
    }
    logger.info("ETL Execution Summary: %s", json.dumps(summary))
    return summary

if __name__ == "__main__":
    try:
        summary = run_etl_pipeline()
        sys.exit(0)
    except Exception as exc:
        logger.critical("ETL pipeline fatal failure: %s", exc, exc_info=True)
        sys.exit(1)
