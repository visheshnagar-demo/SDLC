"""Standalone Connector Pipeline Runner: test04_etl
Ingests CSV from GCS (gs://sdlc-workspec-store/etl/data/my_file (1).csv),
transforms and orders by rank ASC, and loads into BigQuery (upbeat-repeater-477110-q6.analytics.test04).
"""
import os
import sys
import logging
import argparse
from datetime import datetime

try:
    import pandas as pd
except ImportError:
    pd = None

from pipeline.extractor import GCSExtractor
from pipeline.transformer import DataTransformer
from pipeline.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("test04_etl")


class PipelineRunner:
    """End-to-end runner for test04 ETL pipeline."""

    def __init__(self, execution_date: str = None):
        self.execution_date = execution_date or datetime.utcnow().strftime("%Y-%m-%d")
        self.staging_dir = os.path.join("staging", "test04_etl", self.execution_date)
        os.makedirs(self.staging_dir, exist_ok=True)
        self.staging_file = os.path.join(self.staging_dir, "data.parquet")

        self.extractor = GCSExtractor()
        self.transformer = DataTransformer()
        self.loader = BigQueryLoader()

    def extract(self) -> int:
        """Extracts data from GCS into staging parquet format."""
        logger.info("Starting extraction from GCS...")
        df = self.extractor.extract()
        if df.empty:
            raise FileNotFoundError("FATAL: Extracted 0 rows from GCS source.")
        df.to_parquet(self.staging_file, index=False)
        logger.info("Extracted %d records and cached to %s", len(df), self.staging_file)
        return len(df)

    def transform(self) -> int:
        """Transforms and sorts data by rank ascending."""
        if not os.path.exists(self.staging_file) or os.path.getsize(self.staging_file) == 0:
            logger.warning("Staging file is empty. Nothing to transform.")
            return 0

        raw_df = pd.read_parquet(self.staging_file)
        transformed_df = self.transformer.transform(raw_df)
        transformed_df.to_parquet(self.staging_file, index=False)
        logger.info("Transform completed. Staged %d valid records.", len(transformed_df))
        return len(transformed_df)

    def load(self) -> bool:
        """Loads transformed records into BigQuery table upbeat-repeater-477110-q6.analytics.test04."""
        if not os.path.exists(self.staging_file) or os.path.getsize(self.staging_file) == 0:
            logger.warning("Staging file %s is empty. Skipping load.", self.staging_file)
            return True

        df = pd.read_parquet(self.staging_file)
        self.loader.load(df)
        return True

    def run(self) -> int:
        """Executes the end-to-end pipeline."""
        logger.info("=== Starting test04 ETL Pipeline Execution ===")
        try:
            records = self.extract()
            valid_count = self.transform()
            if records > 0 and valid_count == 0:
                logger.error("FATAL: 0 rows survived transformation. Circuit breaker triggered.")
                sys.exit(1)
            self.load()
            logger.info("=== test04 ETL Pipeline Execution Succeeded ===")
            return 0
        except SystemExit:
            raise
        except Exception as exc:
            logger.critical("Pipeline execution FAILED: %s", exc, exc_info=True)
            raise RuntimeError(f"Pipeline execution FAILED: {exc}") from exc


def main():
    parser = argparse.ArgumentParser(description="test04 ETL Pipeline Runner")
    parser.add_argument("--date", help="Execution date (YYYY-MM-DD)", default=None)
    args = parser.parse_args()

    runner = PipelineRunner(execution_date=args.date)
    exit_code = runner.run()
    if exit_code != 0:
        sys.exit(exit_code)
    sys.exit(0)


if __name__ == "__main__":
    main()
