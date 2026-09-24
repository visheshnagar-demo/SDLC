"""Main entry point for Cloud SQL PostgreSQL to BigQuery ETL Job."""
import sys
from pipeline.run_postgres_to_bigquery import PipelineRunner

def main():
    """Runs the ETL pipeline batch execution."""
    runner = PipelineRunner()
    exit_code = runner.run()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
