"""Server entry point for ETL Pipeline.
Delegates execution to pipeline.run_test03_pipeline.
"""
import sys
from pipeline.run_test03_pipeline import PipelineRunner, logger

def main():
    try:
        runner = PipelineRunner()
        exit_code = runner.run()
        sys.exit(exit_code)
    except Exception as exc:
        logger.critical("Server ETL pipeline failed: %s", exc, exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
