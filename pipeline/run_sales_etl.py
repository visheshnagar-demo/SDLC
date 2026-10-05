"""Standalone Sales ETL Pipeline Runner for Cloud Run Job.

Ingests sales CSV from Google Cloud Storage, sanitizes and deduplicates records,
and loads them into partitioned BigQuery table.
Complies with zero-mock, fail-fast, zero-scheduler policies.
"""
import os
import sys
import json
import time
import logging
import argparse
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import pandas as pd

from pipeline.extractor import GCSExtractor
from pipeline.transformer import SalesDataTransformer
from pipeline.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("sales_etl.runner")


class PipelineRunner:
    """Orchestrates end-to-end sales ETL execution."""

    def __init__(
        self,
        execution_date: Optional[str] = None,
        bucket_name: Optional[str] = None,
        source_prefix: Optional[str] = None,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        write_mode: str = "append",
    ):
        self.execution_date = execution_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.project_id = (
            project_id
            or os.getenv("GCP_PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or "upbeat-repeater-477110-q6"
        )
        self.bucket_name = (
            bucket_name
            or os.getenv("GCS_SOURCE_BUCKET")
            or "sdlc-workspec-store"
        )
        self.source_prefix = (
            source_prefix
            or os.getenv("GCS_SOURCE_PREFIX")
            or "etl/data/raw_sales_data.csv"
        )
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET") or "analytics"
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE") or "aarchi_gcs_test1"
        self.write_mode = write_mode

        self.staging_dir = os.path.join("staging", "sales_etl", self.execution_date)
        os.makedirs(self.staging_dir, exist_ok=True)
        self.staging_file = os.path.join(self.staging_dir, "data.parquet")

    def run(self) -> int:
        """Executes the full ETL cycle.

        Returns:
            int: 0 on success. Exits with code 1 on failure.
        """
        start_time = time.time()
        logger.info("=== Starting Sales ETL Pipeline Execution ===")
        logger.info(
            "Source: gs://%s/%s -> Destination: %s.%s.%s",
            self.bucket_name,
            self.source_prefix,
            self.project_id,
            self.dataset_id,
            self.table_id,
        )

        try:
            # Step 1: Extraction
            extractor = GCSExtractor(
                bucket_name=self.bucket_name,
                source_prefix=self.source_prefix,
                project_id=self.project_id,
            )
            df_raw = extractor.extract_to_dataframe()
            rows_extracted = len(df_raw)
            logger.info("Successfully extracted %d raw records.", rows_extracted)

            if rows_extracted == 0:
                logger.error("FATAL: Source data is empty. Circuit breaker triggered.")
                sys.exit(1)

            # Save initial extraction to staging
            df_raw.to_parquet(self.staging_file, index=False)

            # Step 2: Transformation & Deduplication
            transformer = SalesDataTransformer()
            df_clean, metrics = transformer.transform(df_raw)
            rows_to_load = len(df_clean)
            logger.info(
                "Transformation complete: %d rows ready to load (%d duplicates removed).",
                rows_to_load,
                metrics.get("duplicates_removed", 0),
            )

            if rows_to_load == 0:
                logger.error("FATAL: 0 records remained after transformation. Failing pipeline.")
                sys.exit(1)

            # Save cleaned data to staging
            df_clean.to_parquet(self.staging_file, index=False)

            # Step 3: BigQuery Load
            loader = BigQueryLoader(
                project_id=self.project_id,
                dataset_id=self.dataset_id,
                table_id=self.table_id,
            )
            rows_loaded = loader.load(df_clean, write_mode=self.write_mode)
            logger.info("Successfully loaded %d records into BigQuery.", rows_loaded)

            duration = time.time() - start_time
            summary_metrics = {
                "severity": "INFO",
                "message": "Sales ETL batch completed successfully",
                "batch_id": metrics.get("batch_id"),
                "source_file": f"gs://{self.bucket_name}/{self.source_prefix}",
                "target_table": f"{self.project_id}.{self.dataset_id}.{self.table_id}",
                "metrics": {
                    "rows_extracted": rows_extracted,
                    "rows_cleaned": metrics.get("rows_cleaned", 0),
                    "rows_deduplicated": rows_to_load,
                    "duplicates_removed": metrics.get("duplicates_removed", 0),
                    "rows_written": rows_loaded,
                    "execution_duration_sec": round(duration, 3),
                },
            }
            logger.info("EXECUTION_TELEMETRY: %s", json.dumps(summary_metrics))
            logger.info("=== Sales ETL Pipeline Finished Successfully ===")
            return 0

        except SystemExit:
            raise
        except Exception as exc:
            duration = time.time() - start_time
            error_telemetry = {
                "severity": "ERROR",
                "message": f"Sales ETL batch failed: {exc}",
                "source_file": f"gs://{self.bucket_name}/{self.source_prefix}",
                "target_table": f"{self.project_id}.{self.dataset_id}.{self.table_id}",
                "execution_duration_sec": round(duration, 3),
            }
            logger.critical("EXECUTION_TELEMETRY: %s", json.dumps(error_telemetry), exc_info=True)
            sys.exit(1)


def main() -> int:
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(description="Sales ETL Pipeline Runner")
    parser.add_argument("--date", help="Execution date (YYYY-MM-DD)", default=None)
    parser.add_argument("--bucket", help="GCS Source Bucket", default=None)
    parser.add_argument("--prefix", help="GCS Source Prefix", default=None)
    parser.add_argument("--project", help="GCP Project ID", default=None)
    parser.add_argument("--dataset", help="BigQuery Dataset", default=None)
    parser.add_argument("--table", help="BigQuery Table", default=None)
    parser.add_argument("--write-mode", help="Write Mode (append/overwrite)", default="append")
    args = parser.parse_args()

    runner = PipelineRunner(
        execution_date=args.date,
        bucket_name=args.bucket,
        source_prefix=args.prefix,
        project_id=args.project,
        dataset_id=args.dataset,
        table_id=args.table,
        write_mode=args.write_mode,
    )
    return runner.run()


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
