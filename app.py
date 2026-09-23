"""Entrypoint script for Cloud Run Job execution."""
import sys
from pipeline.run_sales_etl import run_pipeline

if __name__ == "__main__":
    sys.exit(run_pipeline())
