"""ETL Pipeline Runner orchestrating extraction, validation, and loading."""
import os
import sys
import json
import logging
import argparse
from datetime import datetime, timezone

try:
    import pandas as pd
except ImportError:
    pd = None

from server.pipeline.quarantine import QuarantineManager
from server.pipeline.cleanser import SalesDataCleanser
from server.pipeline.extractor import PostgresExtractor
from server.pipeline.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("server.pipeline.main")


class PipelineRunner:
    """Orchestrates extraction, cleansing, staging, and BigQuery ingestion."""

    def __init__(
        self,
        execution_date: str = None,
        source_table: str = "raw_sales_orders",
        target_dataset: str = "dev_sales",
        target_table: str = "fct_sales_orders_v1",
    ):
        self.execution_date = execution_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.staging_dir = os.path.join("staging", "sales_etl", self.execution_date)
        os.makedirs(self.staging_dir, exist_ok=True)
        self.staging_file = os.path.join(self.staging_dir, "clean_sales_orders.parquet")

        self.quarantine_manager = QuarantineManager()
        self.extractor = PostgresExtractor(table_name=source_table)
        self.cleanser = SalesDataCleanser(quarantine_manager=self.quarantine_manager)
        self.loader = BigQueryLoader(dataset_id=target_dataset, table_id=target_table)

    def run(self) -> int:
        start_time = datetime.now(timezone.utc)
        logger.info(
            "=== Starting PostgreSQL to BigQuery Sales ETL Pipeline [%s] ===",
            self.execution_date,
        )
        try:
            # 1. Extraction
            raw_df = self.extractor.extract()
            total_extracted = len(raw_df)

            # 2. Cleansing & Validation
            clean_df = self.cleanser.clean_records(raw_df)
            total_valid = len(clean_df) if clean_df is not None else 0
            total_quarantined = self.quarantine_manager.total_quarantined

            # 3. Stage locally to Parquet
            if (
                clean_df is not None
                and len(clean_df) > 0
                and pd is not None
                and isinstance(clean_df, pd.DataFrame)
            ):
                clean_df.to_parquet(self.staging_file, index=False)
                logger.info("Staged %d validated records to %s", total_valid, self.staging_file)

            # 4. Load into BigQuery
            self.loader.load(clean_df)

            end_time = datetime.now(timezone.utc)
            duration = (end_time - start_time).total_seconds()

            summary = {
                "pipeline_name": "postgres_to_bigquery_sales_etl",
                "execution_date": self.execution_date,
                "status": "COMPLETED",
                "duration_seconds": duration,
                "metrics": {
                    "records_extracted": total_extracted,
                    "records_valid": total_valid,
                    "records_quarantined": total_quarantined,
                    "filtered_missing_or_invalid_amount": self.quarantine_manager.reason_counts.get(
                        "ERR_MISSING_OR_INVALID_AMOUNT", 0
                    ),
                    "filtered_invalid_email": self.quarantine_manager.reason_counts.get(
                        "ERR_INVALID_EMAIL_FORMAT", 0
                    ),
                    "filtered_invalid_order_date": self.quarantine_manager.reason_counts.get(
                        "ERR_INVALID_ORDER_DATE", 0
                    ),
                    "filtered_missing_order_id": self.quarantine_manager.reason_counts.get(
                        "ERR_MISSING_ORDER_ID", 0
                    ),
                    "records_loaded": total_valid,
                },
            }
            logger.info("ETL Execution Summary:\n%s", json.dumps(summary, indent=2))
            logger.info("=== Pipeline Execution Finished Successfully ===")
            return 0
        except Exception as exc:
            logger.critical("Pipeline execution FAILED: %s", exc, exc_info=True)
            return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PostgreSQL to BigQuery Sales ETL Pipeline Runner")
    parser.add_argument("--date", help="Execution date (YYYY-MM-DD)", default=None)
    parser.add_argument("--source-table", help="Source PostgreSQL table", default="raw_sales_orders")
    parser.add_argument("--target-dataset", help="BigQuery dataset", default="dev_sales")
    parser.add_argument("--target-table", help="BigQuery table", default="fct_sales_orders_v1")
    args = parser.parse_args()

    runner = PipelineRunner(
        execution_date=args.date,
        source_table=args.source_table,
        target_dataset=args.target_dataset,
        target_table=args.target_table,
    )
    sys.exit(runner.run())
