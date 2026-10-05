"""App entrypoint wrapper for Cloud Run Job sales ETL execution."""
import sys
from pipeline.run_sales_etl import main

if __name__ == "__main__":
    sys.exit(main())
