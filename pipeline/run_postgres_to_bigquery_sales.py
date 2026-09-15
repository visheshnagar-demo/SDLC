"""Standalone Connector Pipeline: postgres_to_bigquery_sales
Architecture: PostgreSQL (raw_sales_orders) -> Cleansing & RFC 5322 Validation -> BigQuery (dev_sales.fct_sales_orders_v1)
"""
import argparse
import json
import logging
import os
import sys
from datetime import datetime
from uuid import uuid4

from server.etl.extractor import PostgreSQLExtractor
from server.etl.loader import BigQueryLoader
from server.etl.transformer import DataTransformer
from server.etl.validator import DataValidator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("postgres_to_bigquery_sales")


class PipelineRunner:
    def __init__(self, execution_date: str = None):
        self.execution_date = execution_date or datetime.utcnow().strftime("%Y-%m-%d")
        self.run_id = str(uuid4())
        self.extractor = PostgreSQLExtractor()
        self.validator = DataValidator()
        self.transformer = DataTransformer(pipeline_run_id=self.run_id)
        self.loader = BigQueryLoader()

    def run(self) -> int:
        """Executes the end-to-end pipeline with strict validation and error handling."""
        logger.info("=== Starting Connector Pipeline Execution [Run ID: %s] ===", self.run_id)
        try:
            # 1. Extraction
            raw_records = self.extractor.extract_all()
            logger.info("Extracted %d raw records from PostgreSQL.", len(raw_records))

            # 2. Validation & Cleansing
            val_result = self.validator.validate_batch(raw_records)
            logger.info(
                "Cleansing Summary: valid=%d, filtered_missing_amount=%d, filtered_invalid_email=%d",
                len(val_result.valid_records),
                val_result.filtered_missing_amount_count,
                val_result.filtered_invalid_email_count,
            )

            # 3. Transformation
            clean_records = self.transformer.transform_batch(val_result.valid_records)

            # 4. Loading to BigQuery
            if clean_records:
                self.loader.ensure_table_exists()
                self.loader.load_records(clean_records)

            logger.info("=== Pipeline Execution Finished Successfully ===")
            return 0
        except Exception as exc:
            logger.critical("Pipeline execution FAILED: %s", exc, exc_info=True)
            return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Connector Pipeline Runner")
    parser.add_argument("--date", help="Execution date (YYYY-MM-DD)", default=None)
    args = parser.parse_args()

    runner = PipelineRunner(execution_date=args.date)
    exit_code = runner.run()
    sys.exit(exit_code)
