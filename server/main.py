"""Main entrypoint for Sales Orders Daily Batch ETL Pipeline.
Deployed as a standalone Cloud Run Job container.
"""
import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Dict, Any

from server.pipeline.extractor import GCSFileReader
from server.pipeline.transformer import SalesDataTransformer
from server.pipeline.loader import BigQueryLoader

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
    stream=sys.stdout,
)
logger = logging.getLogger("sales_orders_etl.main")


class ETLRunner:
    """Coordinates extract, transform, and load operations for sales orders."""

    def __init__(
        self,
        source_uri: str,
        project_id: str,
        dataset_id: str = "analytics",
        table_id: str = "sales_orders",
        location: str = "us-central1",
    ):
        self.source_uri = source_uri
        self.project_id = project_id
        self.dataset_id = dataset_id
        self.table_id = table_id
        self.location = location

        self.extractor = GCSFileReader()
        self.transformer = SalesDataTransformer()
        self.loader = BigQueryLoader(
            project_id=self.project_id,
            dataset_id=self.dataset_id,
            table_id=self.table_id,
            location=self.location,
        )

    def run(self) -> Dict[str, Any]:
        """Executes the complete ETL lifecycle.

        Returns:
            Dictionary containing run summary metrics.

        Raises:
            Exception on critical pipeline failures.
        """
        start_time = time.time()
        execution_ts = datetime.now(timezone.utc)
        logger.info("=" * 60)
        logger.info("Starting Sales Orders Batch ETL Pipeline Run")
        logger.info(f"Source URI: {self.source_uri}")
        logger.info(f"Target BigQuery Table: {self.project_id}.{self.dataset_id}.{self.table_id}")
        logger.info(f"Execution Time (UTC): {execution_ts.isoformat()}")
        logger.info("=" * 60)

        # 1. Extraction Phase
        logger.info("Stage 1/3: Extracting raw data from Google Cloud Storage...")
        df_raw = self.extractor.extract_from_gcs(self.source_uri)
        extracted_count = len(df_raw)
        logger.info(f"Stage 1 Complete. Extracted {extracted_count} raw rows.")

        if extracted_count == 0:
            duration_ms = int((time.time() - start_time) * 1000)
            summary = {
                "status": "SUCCESS",
                "message": "CSV was empty; 0 records to process",
                "source_uri": self.source_uri,
                "target_table": f"{self.project_id}.{self.dataset_id}.{self.table_id}",
                "records_extracted": 0,
                "records_cleaned": 0,
                "records_deduplicated": 0,
                "records_loaded": 0,
                "duration_ms": duration_ms,
            }
            logger.info(f"ETL Execution Summary: {json.dumps(summary)}")
            return summary

        # 2. Transformation & Deduplication Phase
        logger.info("Stage 2/3: Sanitizing, validating, and deduplicating records...")
        df_clean, metrics = self.transformer.transform(df_raw, execution_time=execution_ts)
        logger.info(
            f"Stage 2 Complete. Validated {metrics['records_cleaned']} records, "
            f"deduplicated to {metrics['records_deduplicated']} records."
        )

        # 3. Loading Phase
        logger.info("Stage 3/3: Loading transformed records into BigQuery partition...")
        loaded_count = self.loader.load_dataframe(df_clean, write_disposition="WRITE_APPEND")
        logger.info(f"Stage 3 Complete. Loaded {loaded_count} records into BigQuery.")

        duration_ms = int((time.time() - start_time) * 1000)
        summary = {
            "status": "SUCCESS",
            "message": "ETL pipeline completed successfully",
            "source_uri": self.source_uri,
            "target_table": f"{self.project_id}.{self.dataset_id}.{self.table_id}",
            "records_extracted": extracted_count,
            "records_cleaned": metrics["records_cleaned"],
            "records_deduplicated": metrics["records_deduplicated"],
            "records_dropped": metrics["records_dropped"],
            "records_loaded": loaded_count,
            "duration_ms": duration_ms,
        }

        logger.info("=" * 60)
        logger.info(f"ETL Execution Summary: {json.dumps(summary)}")
        logger.info("Pipeline execution completed successfully.")
        logger.info("=" * 60)
        return summary


def parse_args() -> argparse.Namespace:
    """Parses command line arguments with environment variable fallbacks."""
    parser = argparse.ArgumentParser(description="Sales Orders Cloud Run Job Batch ETL")
    parser.add_argument(
        "--source-uri",
        type=str,
        default=os.getenv("GCS_SOURCE_URI", "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv"),
        help="GCS URI to source CSV file",
    )
    parser.add_argument(
        "--project-id",
        type=str,
        default=os.getenv("GCP_PROJECT_ID", os.getenv("PROJECT_ID", "upbeat-repeater-477110-q6")),
        help="GCP Project ID for BigQuery",
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=os.getenv("BIGQUERY_DATASET", "analytics"),
        help="BigQuery target dataset",
    )
    parser.add_argument(
        "--table",
        type=str,
        default=os.getenv("BIGQUERY_TABLE", "sales_orders"),
        help="BigQuery target table name",
    )
    parser.add_argument(
        "--location",
        type=str,
        default=os.getenv("BIGQUERY_LOCATION", "us-central1"),
        help="GCP resource location",
    )
    return parser.parse_args()


def main() -> None:
    """Main execution function exiting with 0 on success and 1 on error."""
    args = parse_args()
    try:
        runner = ETLRunner(
            source_uri=args.source_uri,
            project_id=args.project_id,
            dataset_id=args.dataset,
            table_id=args.table,
            location=args.location,
        )
        runner.run()
        sys.exit(0)
    except Exception as exc:
        logger.exception(f"CRITICAL: Pipeline execution failed with unhandled error: {str(exc)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
