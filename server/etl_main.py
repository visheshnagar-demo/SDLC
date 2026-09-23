import json
import logging
import sys
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from server.config import settings
from server.db_extractor import PostgresExtractor
from server.transformer import DataTransformer
from server.bq_loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("etl.pipeline")

# In-memory execution state for status querying
LATEST_EXECUTION_STATE: Dict[str, Any] = {
    "status": "NOT_STARTED",
    "last_run_at": None,
    "metrics": None,
    "error": None,
}


def run_etl_pipeline(
    extractor: Optional[PostgresExtractor] = None,
    transformer: Optional[DataTransformer] = None,
    loader: Optional[BigQueryLoader] = None,
) -> Dict[str, Any]:
    """Runs the end-to-end ETL pipeline."""
    start_time = time.time()
    run_timestamp = datetime.now(timezone.utc).isoformat()
    logger.info("Starting ETL Pipeline at %s", run_timestamp)

    try:
        extractor = extractor or PostgresExtractor()
        transformer = transformer or DataTransformer()
        loader = loader or BigQueryLoader()

        # Step 1: Extract
        df_raw = extractor.extract()

        # Step 2: Transform & Clean
        df_cleaned, metrics = transformer.clean_and_transform(df_raw)

        # Step 3: Load to BigQuery
        load_result = loader.load_dataframe(df_cleaned)

        duration = round(time.time() - start_time, 2)
        metrics["duration_seconds"] = duration
        metrics["status"] = "SUCCESS"
        metrics["source_table"] = settings.SOURCE_TABLE
        metrics["target_table"] = f"{settings.BQ_DATASET}.{settings.BQ_TARGET_TABLE}"
        metrics["executed_at"] = run_timestamp
        metrics["load_result"] = load_result

        # Update latest execution state
        LATEST_EXECUTION_STATE["status"] = "SUCCESS"
        LATEST_EXECUTION_STATE["last_run_at"] = run_timestamp
        LATEST_EXECUTION_STATE["metrics"] = metrics
        LATEST_EXECUTION_STATE["error"] = None

        structured_log = {
            "event": "ETL_EXECUTION_METRICS",
            **metrics,
        }
        logger.info("ETL Run Complete: %s", json.dumps(structured_log))
        return metrics

    except Exception as exc:
        duration = round(time.time() - start_time, 2)
        error_msg = str(exc)
        logger.error(
            "ETL Pipeline failed after %.2fs: %s", duration, error_msg, exc_info=True
        )

        failure_metrics = {
            "status": "FAILED",
            "source_table": settings.SOURCE_TABLE,
            "target_table": f"{settings.BQ_DATASET}.{settings.BQ_TARGET_TABLE}",
            "executed_at": run_timestamp,
            "duration_seconds": duration,
            "error": error_msg,
        }
        LATEST_EXECUTION_STATE["status"] = "FAILED"
        LATEST_EXECUTION_STATE["last_run_at"] = run_timestamp
        LATEST_EXECUTION_STATE["metrics"] = failure_metrics
        LATEST_EXECUTION_STATE["error"] = error_msg

        return failure_metrics


def get_latest_status() -> Dict[str, Any]:
    """Retrieves the status and metrics of the latest ETL job run."""
    return LATEST_EXECUTION_STATE


if __name__ == "__main__":
    result = run_etl_pipeline()
    if result.get("status") == "SUCCESS":
        sys.exit(0)
    else:
        sys.exit(1)
