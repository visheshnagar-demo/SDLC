"""Main CLI entrypoint for Cloud SQL PostgreSQL to BigQuery ETL batch job."""
import sys
from config import get_config
from pipeline.extractor import extract_data
from pipeline.transformer import clean_dataframe
from pipeline.loader import load_to_bigquery
from pipeline.observability import setup_logger, PipelineMetrics


def run_pipeline() -> int:
    cfg = get_config()
    logger = setup_logger("etl_main")
    metrics = PipelineMetrics()

    logger.info("=== Starting PostgreSQL to BigQuery ETL Job ===")
    logger.info("Source Table: %s (DB: %s)", cfg.source_table, cfg.postgres_db)
    logger.info("Target Table: %s.%s.%s", cfg.gcp_project_id, cfg.bigquery_dataset, cfg.bigquery_table)

    target_full_name = f"{cfg.gcp_project_id}.{cfg.bigquery_dataset}.{cfg.bigquery_table}"

    try:
        # 1. Extraction
        raw_df = extract_data(cfg)
        metrics.extracted_count = len(raw_df)

        if raw_df.empty:
            logger.warning("No records extracted from source table '%s'. Exiting successfully.", cfg.source_table)
            metrics.log_summary(logger, cfg.source_table, target_full_name, status="SUCCESS_EMPTY")
            return 0

        # 2. Transformation
        cleaned_df = clean_dataframe(raw_df, cfg)
        metrics.cleaned_count = len(cleaned_df)
        metrics.failed_count = metrics.extracted_count - metrics.cleaned_count

        # 3. Loading
        loaded_count = load_to_bigquery(cleaned_df, cfg)
        metrics.loaded_count = loaded_count

        metrics.log_summary(logger, cfg.source_table, target_full_name, status="SUCCESS")
        logger.info("=== ETL Job Completed Successfully ===")
        return 0

    except Exception as exc:
        metrics.log_summary(logger, cfg.source_table, target_full_name, status="FAILED")
        logger.critical("ETL Job FAILED with error: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    exit_code = run_pipeline()
    sys.exit(exit_code)
