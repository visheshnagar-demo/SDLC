"""Entry point for ETL Pipeline execution."""
import sys
import logging
from pipeline.run_postgres_to_bigquery import PipelineRunner

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)

if __name__ == "__main__":
    runner = PipelineRunner()
    exit_code = runner.run()
    sys.exit(exit_code)
