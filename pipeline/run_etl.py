"""Standalone Connector Pipeline Runner: etl
Architecture: GCS -> Transform (Order by Rank ASC) -> BigQuery (analytics.test02)
Mock dummy data generation is completely disabled — real extraction & loading only.
"""
import os
import sys
import logging
import argparse
from datetime import datetime, timezone
import pandas as pd
from google.cloud import storage, bigquery

from server.etl.extractor import GCSExtractor
from server.etl.validator import DataValidator
from server.etl.transformer import TourDataTransformer
from server.etl.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("etl.runner")


class PipelineRunner:
    def __init__(self, execution_date: str = None):
        self.execution_date = execution_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.staging_dir = os.path.join("staging", "etl", self.execution_date)
        os.makedirs(self.staging_dir, exist_ok=True)
        self.staging_file = os.path.join(self.staging_dir, "data.parquet")

        self.bucket_name = os.getenv("GCS_SOURCE_BUCKET", "sdlc-workspec-store")
        self.prefix = os.getenv("GCS_SOURCE_PREFIX", "etl/data/my_file (1).csv")
        self.source_uri = f"gs://{self.bucket_name}/{self.prefix}"

        self.extractor = GCSExtractor(bucket_name=self.bucket_name, prefix=self.prefix)
        self.validator = DataValidator(required_columns=["Rank"])
        self.transformer = TourDataTransformer(source_file_uri=self.source_uri)
        self.loader = BigQueryLoader(
            project_id=os.getenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6"),
            dataset_id=os.getenv("BIGQUERY_DATASET", "analytics"),
            table_id=os.getenv("BIGQUERY_TABLE", "test02"),
            write_disposition="WRITE_TRUNCATE",
        )

    def extract(self) -> int:
        """Extracts real dataset from GCS into local staging Parquet."""
        logger.info("Extracting data from %s...", self.source_uri)
        df = self.extractor.extract()
        self.validator.validate_raw(df)
        df.to_parquet(self.staging_file, index=False)
        logger.info("Staged %d raw rows into %s", len(df), self.staging_file)
        return len(df)

    def transform(self) -> int:
        """Transforms, sanitizes, and sorts data by Rank ASC."""
        if not os.path.exists(self.staging_file) or os.path.getsize(self.staging_file) == 0:
            raise ValueError(f"Staging file {self.staging_file} is missing or empty.")

        df_raw = pd.read_parquet(self.staging_file)
        df_transformed = self.transformer.transform(df_raw)
        self.validator.validate_transformed(df_transformed)

        # Write back transformed data to staging
        df_transformed.to_parquet(self.staging_file, index=False)
        logger.info("Transformed and staged %d cleaned records.", len(df_transformed))
        return len(df_transformed)

    def load(self) -> bool:
        """Loads staged records into BigQuery table analytics.test02."""
        if not os.path.exists(self.staging_file) or os.path.getsize(self.staging_file) == 0:
            logger.warning("Staging file is empty. Skipping BigQuery load.")
            return True

        df = pd.read_parquet(self.staging_file)
        return self.loader.load(df)

    def run(self) -> int:
        """Executes the end-to-end pipeline."""
        logger.info("=== Starting ETL Pipeline Execution (SCRUM-378) ===")
        extracted_rows = self.extract()
        transformed_rows = self.transform()
        if extracted_rows > 0 and transformed_rows == 0:
            logger.error("FATAL: 0 records survived transformation. Halting pipeline.")
            sys.exit(1)
        self.load()
        logger.info("=== ETL Pipeline Execution Completed Successfully ===")
        return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GCS to BigQuery ETL Runner")
    parser.add_argument("--date", help="Execution date (YYYY-MM-DD)", default=None)
    args = parser.parse_args()

    runner = PipelineRunner(execution_date=args.date)
    code = runner.run()
    sys.exit(code)
