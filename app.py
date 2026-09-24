"""ETL Entrypoint Wrapper for SCRUM-378."""
import sys
from pipeline.run_etl import PipelineRunner

def main():
    runner = PipelineRunner()
    exit_code = runner.run()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
