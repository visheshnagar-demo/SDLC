"""Main entry point for Sales ETL Pipeline (SCRUM-355)."""
import sys
from pipeline.run_sales_etl import PipelineRunner


def main() -> None:
    """Executes the Sales ETL pipeline."""
    runner = PipelineRunner()
    exit_code = runner.run()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
