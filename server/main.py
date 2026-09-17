"""Main Entrypoint for Sales Order ETL Cloud Run Job.

Orchestrates the batch ETL lifecycle:
1. GCS extraction of raw sales orders CSV.
2. Cleaning, type standardization, and primary key deduplication.
3. Loading into partitioned and clustered BigQuery table.
"""

import argparse
import json
import logging
import os
import sys
import time
from typing import Any, Dict

from server.bigquery_loader import BigQueryLoader
from server.gcs_extractor import GCSExtractor
from server.transformation_engine import TransformationEngine


class JsonFormatter(logging.Formatter):
    """Formats log records as structured JSON."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "severity": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Include extra contextual fields
        for key, value in record.__dict__.items():
            if key not in {
                "args",
                "asctime",
                "created",
                "exc_info",
                "exc_text",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "msg",
                "name",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "stack_info",
                "thread",
                "threadName",
            }:
                log_entry[key] = value
        return json.dumps(log_entry, default=str)


def setup_logging(log_level_name: str = "INFO") -> None:
    """Configures structured JSON logging on stdout."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root_logger = logging.getLogger()
    level = getattr(logging, log_level_name.upper(), logging.INFO)
    root_logger.setLevel(level)
    # Remove existing handlers to avoid duplication
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)
    root_logger.addHandler(handler)


def parse_args() -> argparse.Namespace:
    """Parses CLI arguments and falls back to environment variables."""
    parser = argparse.ArgumentParser(description="Sales Order Batch ETL Job")
    parser.add_argument(
        "--source-uri",
        type=str,
        default=os.getenv("GCS_SOURCE_URI", "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv"),
        help="GCS URI of the source CSV file (gs://bucket/path/file.csv)",
    )
    parser.add_argument(
        "--project-id",
        type=str,
        default=os.getenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6"),
        help="GCP Project ID",
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=os.getenv("BQ_DATASET", "analytics"),
        help="BigQuery destination dataset",
    )
    parser.add_argument(
        "--table",
        type=str,
        default=os.getenv("BQ_TABLE", "new_sales_orders"),
        help="BigQuery destination table",
    )
    parser.add_argument(
        "--write-disposition",
        type=str,
        default=os.getenv("BQ_WRITE_DISPOSITION", "WRITE_APPEND"),
        choices=["WRITE_APPEND", "WRITE_TRUNCATE"],
        help="BigQuery write disposition mode",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=os.getenv("DRY_RUN", "false").lower() in ("true", "1", "yes"),
        help="Execute extraction and transformation without loading to BigQuery",
    )
    return parser.parse_args()


def run_pipeline(
    source_uri: str,
    project_id: str,
    dataset: str,
    table: str,
    write_disposition: str = "WRITE_APPEND",
    dry_run: bool = False,
    extractor: GCSExtractor = None,
    transformer: TransformationEngine = None,
    loader: BigQueryLoader = None,
) -> Dict[str, Any]:
    """Executes the complete ETL pipeline.

    Args:
        source_uri: GCS source URI.
        project_id: GCP project ID.
        dataset: Target BigQuery dataset.
        table: Target BigQuery table.
        write_disposition: Target write mode.
        dry_run: If True, skips BigQuery load.
        extractor: Optional GCSExtractor instance.
        transformer: Optional TransformationEngine instance.
        loader: Optional BigQueryLoader instance.

    Returns:
        Summary metrics dictionary.
    """
    logger = logging.getLogger("sales_order_etl.main")
    start_time = time.time()

    logger.info(
        "Starting Sales Order ETL Pipeline",
        extra={
            "event": "PIPELINE_START",
            "source_uri": source_uri,
            "project_id": project_id,
            "target": f"{project_id}.{dataset}.{table}",
            "dry_run": dry_run,
        },
    )

    extractor = extractor or GCSExtractor()
    transformer = transformer or TransformationEngine()

    # 1. Extraction
    raw_df = extractor.extract_csv(source_uri)
    if raw_df is None:
        duration = round(time.time() - start_time, 2)
        summary = {
            "status": "SKIPPED",
            "reason": "SOURCE_FILE_NOT_FOUND",
            "records_ingested": 0,
            "records_loaded": 0,
            "duration_seconds": duration,
        }
        logger.warning("Pipeline completed: source file was not found", extra=summary)
        return summary

    if raw_df.empty:
        duration = round(time.time() - start_time, 2)
        summary = {
            "status": "COMPLETED",
            "reason": "EMPTY_SOURCE_FILE",
            "records_ingested": 0,
            "records_loaded": 0,
            "duration_seconds": duration,
        }
        logger.info("Pipeline completed: source file contained zero data rows", extra=summary)
        return summary

    # 2. Transformation & Deduplication
    clean_df, metrics = transformer.transform(raw_df)

    # 3. Loading
    records_loaded = 0
    if not dry_run and not clean_df.empty:
        loader = loader or BigQueryLoader(project_id=project_id, dataset_id=dataset, table_id=table)
        records_loaded = loader.load_dataframe(clean_df, write_disposition=write_disposition)
    else:
        records_loaded = len(clean_df)
        logger.info(
            "Dry-run mode active; skipped BigQuery load",
            extra={"event": "DRY_RUN_SKIP_LOAD", "records_staged": records_loaded},
        )

    duration = round(time.time() - start_time, 2)
    summary = {
        "status": "SUCCESS",
        "records_ingested": metrics.get("records_ingested", 0),
        "records_cleaned": metrics.get("records_cleaned", 0),
        "records_deduplicated": metrics.get("records_deduplicated", 0),
        "records_loaded": records_loaded,
        "target_table": f"{project_id}.{dataset}.{table}",
        "duration_seconds": duration,
    }

    logger.info("Sales Order ETL Pipeline completed successfully", extra={"event": "PIPELINE_SUCCESS", **summary})
    return summary


def main() -> None:
    """CLI execution entrypoint."""
    setup_logging(os.getenv("LOG_LEVEL", "INFO"))
    args = parse_args()

    try:
        summary = run_pipeline(
            source_uri=args.source_uri,
            project_id=args.project_id,
            dataset=args.dataset,
            table=args.table,
            write_disposition=args.write_disposition,
            dry_run=args.dry_run,
        )
        print(json.dumps({"pipeline_execution_summary": summary}, indent=2))
        sys.exit(0)
    except Exception as err:
        logging.getLogger("sales_order_etl.main").critical(
            "Pipeline failed with unhandled exception",
            extra={"event": "PIPELINE_FAILED", "error": str(err)},
            exc_info=True,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
