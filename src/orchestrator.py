"""Pipeline orchestrator coordinating Extract, Transform, and Load operations."""
import sys
import time
from typing import Dict, Any

from src.config import PipelineConfig
from src.extractor import CloudSqlExtractor
from src.loader import BigQueryLoader
from src.logger import get_logger
from src.transformer import DataSanitizer


def run_pipeline() -> Dict[str, Any]:
    """Executes the complete ETL pipeline lifecycle."""
    start_time = time.time()
    config = PipelineConfig.from_env()
    logger = get_logger("etl_pipeline.orchestrator", config.log_level)

    logger.info("Starting Cloud SQL to BigQuery ETL Pipeline execution.")
    logger.info(
        "Source: %s.%s | Target: %s.%s.%s",
        config.instance_connection_name,
        config.source_table,
        config.gcp_project,
        config.bq_dataset,
        config.bq_table,
    )

    extractor = CloudSqlExtractor(config)
    sanitizer = DataSanitizer()
    loader = BigQueryLoader(config)

    try:
        # 1. Extraction
        raw_df = extractor.extract()
        extracted_count = len(raw_df)

        if extracted_count == 0:
            logger.warning("Source table '%s' is empty. Halting pipeline cleanly.", config.source_table)
            duration = round(time.time() - start_time, 2)
            metrics = {
                "source_table": config.source_table,
                "target_table": f"{config.bq_dataset}.{config.bq_table}",
                "rows_extracted": 0,
                "duplicates_removed": 0,
                "nulls_sanitized": 0,
                "rows_loaded": 0,
                "duration_seconds": duration,
            }
            logger.info("Pipeline completed cleanly with 0 rows.", extra={"metrics": metrics})
            return metrics

        # 2. Transformation & Sanitization
        clean_df, transform_metrics = sanitizer.clean(raw_df)

        # 3. Loading
        loaded_count = loader.load(clean_df)

        duration = round(time.time() - start_time, 2)
        metrics = {
            "source_table": config.source_table,
            "target_table": f"{config.bq_dataset}.{config.bq_table}",
            "rows_extracted": transform_metrics.extracted_count,
            "duplicates_removed": transform_metrics.duplicates_removed,
            "nulls_sanitized": transform_metrics.nulls_sanitized,
            "rows_loaded": loaded_count,
            "duration_seconds": duration,
        }

        logger.info("Pipeline execution completed successfully.", extra={"metrics": metrics})
        return metrics

    except Exception as exc:
        logger.error("Pipeline execution failed: %s", exc, exc_info=True)
        raise


if __name__ == "__main__":
    try:
        result = run_pipeline()
        sys.exit(0)
    except Exception as exc:
        sys.exit(1)
