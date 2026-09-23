"""Sales ETL Application Entrypoint for Cloud Run Job."""
import sys
from pipeline.run_sales_etl import run_pipeline

if __name__ == "__main__":
    exit_code = run_pipeline()
    sys.exit(exit_code)
