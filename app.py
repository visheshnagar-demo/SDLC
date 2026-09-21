"""Main entry point for SCRUM-333 ETL execution."""
import sys
from pipeline.run_etl import run_pipeline

if __name__ == "__main__":
    exit_code = run_pipeline()
    if exit_code != 0:
        sys.exit(1)
    sys.exit(0)
