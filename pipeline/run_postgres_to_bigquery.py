"""Standalone runner for Cloud SQL PostgreSQL to BigQuery ETL pipeline."""

import json
import logging
import sys
import time
from datetime import datetime, timezone
from pipeline.config import PipelineConfig
from pipeline.extractor import PostgresExtractor
from pipeline.transformer import DataTransformer
from pipeline.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}',
)
logger = logging.getLogger("etl_runner")


def run_pipeline() -> dict:
    """Execute the end-to-end ETL pipeline and return metrics."""
    start_time = time.time()
    execution_id = f"exec_{int(start_time)}"
    logger.info(f"Starting ETL execution: {execution_id}")

    try:
        config = PipelineConfig.from_env()
    except Exception as e:
        logger.error(f"Failed to load pipeline configuration: {e}")
        raise

    # 1. Extract
    try:
        extractor = PostgresExtractor(config)
        raw_df = extractor.extract()
    except Exception as e:
        logger.error(f"Extraction step failed: {e}")
        raise

    # 2. Transform
    try:
        transformer = DataTransformer()
        cleaned_df, metrics = transformer.transform(raw_df)
    except Exception as e:
        logger.error(f"Transformation step failed: {e}")
        raise

    # 3. Load
    try:
        loader = BigQueryLoader(config)
        loaded_count = loader.load(cleaned_df, write_disposition="WRITE_TRUNCATE")
    except Exception as e:
        logger.error(f"BigQuery loading step failed: {e}")
        raise

    duration = time.time() - start_time
    summary = {
        "execution_id": execution_id,
        "status": "SUCCESS",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "source_table": config.source_table,
        "target_table": f"{config.bigquery_dataset}.{config.bigquery_table}",
        "source_row_count": metrics["source_row_count"],
        "cleaned_row_count": metrics["cleaned_row_count"],
        "dropped_row_count": metrics["dropped_row_count"],
        "loaded_row_count": loaded_count,
        "execution_time_seconds": round(duration, 3),
    }

    logger.info(f"ETL pipeline finished successfully: {json.dumps(summary)}")
    return summary


def main():
    """Main entrypoint for Cloud Run Job execution."""
    try:
        summary = run_pipeline()
        print(f"ETL_EXECUTION_RESULT={json.dumps(summary)}")
        sys.exit(0)
    except Exception as err:
        logger.critical(f"ETL pipeline execution failed: {err}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
