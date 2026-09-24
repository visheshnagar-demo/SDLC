"""Runner module pointing to SCRUM-375 ETL pipeline execution."""

import json
import logging
import sys
from pipeline.run_test01_pipeline import main as run_test01_main
from server.main import run_etl

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}',
)
logger = logging.getLogger("etl_runner")


def run_pipeline() -> dict:
    """Execute the end-to-end ETL pipeline and return metrics."""
    return run_etl(
        source_uri="gs://sdlc-workspec-store/etl/data/my_file (1).csv",
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="test01",
        write_disposition="WRITE_TRUNCATE",
    )


def main():
    """Main entrypoint."""
    run_test01_main()


if __name__ == "__main__":
    main()
