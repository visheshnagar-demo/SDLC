"""Standalone Connector Pipeline Runner: postgres_to_bigquery
Generated for Jira Issue: SCRUM-368
Architecture: Cloud SQL PostgreSQL -> Transformations -> BigQuery (analytics.postgres_test2)
Zero-mock policy: executes real extraction, transformation, and loading.
"""
import os
import sys
import logging
import argparse
from datetime import datetime

from pipeline.extractor import CloudSQLExtractor
from pipeline.transformer import DataTransformer
from pipeline.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("postgres_to_bigquery")


class PipelineRunner:
    """Orchestrates end-to-end extraction, transformation, and loading."""

    def __init__(self, execution_date: str = None):
        self.execution_date = execution_date or datetime.utcnow().strftime("%Y-%m-%d")
        self.staging_dir = os.path.join("staging", "postgres_to_bigquery", self.execution_date)
        os.makedirs(self.staging_dir, exist_ok=True)
        self.staging_file = os.path.join(self.staging_dir, "data.parquet")

        self.extractor = CloudSQLExtractor()
        self.transformer = DataTransformer()
        self.loader = BigQueryLoader()

    def extract(self) -> int:
        """Extracts data from PostgreSQL source and writes raw records to parquet staging."""
        logger.info("Phase 1: Extraction starting...")
        df_raw = self.extractor.extract()
        row_count = len(df_raw)
        df_raw.to_parquet(self.staging_file, index=False)
        logger.info("Phase 1 complete: Extracted %d records to %s", row_count, self.staging_file)
        return row_count

    def transform(self) -> int:
        """Transforms staged parquet data and overwrites staging file with cleaned records."""
        logger.info("Phase 2: Transformation starting...")
        import pandas as pd
        if not os.path.exists(self.staging_file) or os.path.getsize(self.staging_file) == 0:
            logger.warning("Staging file is empty or missing. Skipping transformation.")
            return 0

        df_raw = pd.read_parquet(self.staging_file)
        df_clean = self.transformer.transform(df_raw)
        df_clean.to_parquet(self.staging_file, index=False)
        logger.info("Phase 2 complete: %d cleaned records ready for load", len(df_clean))
        return len(df_clean)

    def load(self) -> bool:
        """Loads cleaned records from staging into destination BigQuery table."""
        logger.info("Phase 3: BigQuery loading starting...")
        import pandas as pd
        if not os.path.exists(self.staging_file) or os.path.getsize(self.staging_file) == 0:
            logger.warning("Staging file is empty. Skipping load.")
            return True

        df_clean = pd.read_parquet(self.staging_file)
        return self.loader.load(df_clean)

    def run(self) -> int:
        """Executes the full pipeline with fail-fast semantics."""
        logger.info("=== Starting postgres_to_bigquery Pipeline Execution ===")
        try:
            raw_count = self.extract()
            if raw_count == 0:
                logger.warning("Extraction completed with 0 records.")
            valid_count = self.transform()
            if raw_count > 0 and valid_count == 0:
                logger.error("FATAL: All extracted records failed transformation.")
                sys.exit(1)
            self.load()
            logger.info("=== Pipeline Execution Completed Successfully ===")
            return 0
        except SystemExit:
            raise
        except Exception as exc:
            logger.critical("Pipeline execution FAILED: %s", exc, exc_info=True)
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="PostgreSQL to BigQuery ETL Runner")
    parser.add_argument("--date", help="Execution date (YYYY-MM-DD)", default=None)
    args = parser.parse_args()

    try:
        runner = PipelineRunner(execution_date=args.date)
        exit_code = runner.run()
        sys.exit(exit_code)
    except Exception as exc:
        logger.critical("Fatal error in main runner: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
