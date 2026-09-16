"""Cloud Run Job standalone runner script for Sales Orders ETL."""
import logging
import os
import sys
from server.pipeline.main import ETLPipelineRunner

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("run_sales_etl")


def main():
    """Main execution function for Cloud Run Job."""
    logger.info("Initializing Sales Orders ETL Job execution...")
    source_table = os.getenv("SOURCE_TABLE", "raw_sales_orders")
    batch_size_str = os.getenv("BATCH_SIZE")
    batch_size = int(batch_size_str) if batch_size_str and batch_size_str.isdigit() else None
    dry_run = os.getenv("DRY_RUN", "false").lower() in ("true", "1", "yes")

    runner = ETLPipelineRunner()
    result = runner.run(
        source_table=source_table,
        batch_size=batch_size,
        dry_run=dry_run,
    )

    if result.status == "COMPLETED":
        logger.info(f"ETL Job finished successfully with {result.metrics.records_loaded} records loaded.")
        sys.exit(0)
    else:
        logger.error(f"ETL Job failed: {result.error_message}")
        sys.exit(1)


if __name__ == "__main__":
    main()
