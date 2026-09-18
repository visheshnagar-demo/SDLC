"""Main entrypoint wrapper for the ETL runner."""
import sys
from pipeline.run_test1_etl import PipelineRunner

if __name__ == "__main__":
    runner = PipelineRunner()
    sys.exit(runner.run())
