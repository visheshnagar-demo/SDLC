"""Main CLI Entrypoint for Sales Order ETL Cloud Run Job.

Orchestrates the batch data pipeline:
Extract (GCS) -> Validate -> Transform -> Deduplicate -> Load (BigQuery) -> Audit Telemetry
"""
import sys
import time
from pipeline.config import PipelineConfig
from pipeline.extractor import GCSExtractor
from pipeline.validator import DataValidator
from pipeline.transformer import DataTransformer
from pipeline.deduplicator import Deduplicator
from pipeline.loader import BigQueryLoader
from pipeline.models import PipelineAuditSummary
from pipeline.logger import get_logger

logger = get_logger("main")


def run_pipeline() -> int:
    """Executes the full Sales Order ETL pipeline."""
    start_time = time.time()
    logger.info("==================================================")
    logger.info(" Starting Sales Order ETL Pipeline (Cloud Run Job)")
    logger.info("==================================================")

    try:
        # 1. Load Configuration
        config = PipelineConfig.from_env()
        logger.info(
            f"Config loaded: Source=gs://{config.gcs_source_bucket}/{config.gcs_source_prefix}, "
            f"Target={config.gcp_project_id}.{config.bigquery_dataset}.{config.bigquery_table}"
        )

        # 2. Extract from GCS
        extractor = GCSExtractor(config)
        raw_df = extractor.extract_to_dataframe()
        extracted_count = len(raw_df)

        # 3. Validate Schema & Structure (Fail-fast Circuit Breaker)
        validator = DataValidator()
        validated_df = validator.validate_and_filter(raw_df)

        # 4. Clean & Transform Data
        transformer = DataTransformer()
        transformed_df = transformer.transform(validated_df)
        cleaned_count = len(transformed_df)

        # 5. Deduplicate Records
        deduplicator = Deduplicator(key_columns=["order_id"])
        deduped_df, deduped_count = deduplicator.deduplicate(transformed_df)

        # 6. Load into BigQuery (Partitioned & Clustered)
        loader = BigQueryLoader(config)
        loaded_count = loader.load(deduped_df)

        # 7. Calculate Duration & Emit Structured Audit Summary
        duration_ms = (time.time() - start_time) * 1000
        audit_summary = PipelineAuditSummary(
            source_uri=f"gs://{config.gcs_source_bucket}/{config.gcs_source_prefix}",
            destination_table=f"{config.gcp_project_id}.{config.bigquery_dataset}.{config.bigquery_table}",
            status="SUCCESS",
            extracted_rows=extracted_count,
            cleaned_rows=cleaned_count,
            deduplicated_rows=deduped_count,
            loaded_rows=loaded_count,
            execution_duration_ms=round(duration_ms, 2),
        )

        logger.info(
            f"ETL Execution Summary: {audit_summary.model_dump_json()}",
            extra={
                "extracted_rows": extracted_count,
                "cleaned_rows": cleaned_count,
                "deduplicated_rows": deduped_count,
                "loaded_rows": loaded_count,
                "duration_ms": duration_ms,
            },
        )
        logger.info("==================================================")
        logger.info(" Pipeline Finished Successfully (Exit Code: 0)   ")
        logger.info("==================================================")
        return 0

    except Exception as exc:
        duration_ms = (time.time() - start_time) * 1000
        logger.critical(
            f"ETL Pipeline execution failed: {exc}",
            exc_info=True,
            extra={"duration_ms": duration_ms},
        )
        raise


if __name__ == "__main__":
    try:
        exit_code = run_pipeline()
        sys.exit(exit_code)
    except Exception:
        sys.exit(1)
