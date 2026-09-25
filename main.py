"""Entrypoint for Cloud Run Job / standalone execution of test04 ETL pipeline."""
import sys
from pipeline.run_test04_etl import main

if __name__ == "__main__":
    main()
