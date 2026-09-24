"""Runner script for GCS to BigQuery ETL pipeline (SCRUM-375)."""

import json
import logging
import os
import sys
from server.main import run_etl

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}',
)
logger = logging.getLogger("etl_runner")


def main() -> None:
    """Executes the GCS to BigQuery ETL job."""
    source_uri = os.getenv("SOURCE_GCS_URI", "gs://sdlc-workspec-store/etl/data/my_file (1).csv")
    project_id = os.getenv("GCP_PROJECT", "upbeat-repeater-477110-q6")
    dataset_id = os.getenv("BIGQUERY_DATASET", "analytics")
    table_id = os.getenv("BIGQUERY_TABLE", "test01")
    write_disp = os.getenv("WRITE_DISPOSITION", "WRITE_TRUNCATE")

    try:
        summary = run_etl(
            source_uri=source_uri,
            project_id=project_id,
            dataset_id=dataset_id,
            table_id=table_id,
            write_disposition=write_disp,
        )
        print(f"ETL_EXECUTION_RESULT={json.dumps(summary)}")
        sys.exit(0)
    except Exception as exc:
        logger.critical("ETL pipeline execution failed: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
