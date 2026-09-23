"""Cloud Run Job batch entrypoint for Sales Order ETL Pipeline."""
import sys
import time
import uuid
from datetime import datetime
from server.config import config
from server.extractor import GCSExtractor
from server.loader import BigQueryLoader
from server.logger import logger
from server.models import PipelineMetrics
from server.transformer import DataTransformer
from server.validator import SchemaValidator


def run_pipeline() -> int:
    """Executes the complete ETL pipeline workflow."""
    start_time = time.time()
    batch_id = str(uuid.uuid4())
    logger.info("Starting Sales Order ETL Pipeline Execution (Batch ID: %s)", batch_id)

    metrics = PipelineMetrics(batch_id=batch_id, source_uri=config.gcs_source_uri)

    try:
        # Step 1: Extraction
        extractor = GCSExtractor(
            bucket_name=config.gcs_source_bucket,
            prefix=config.gcs_source_prefix,
        )
        raw_df = extractor.extract()
        metrics.records_extracted = len(raw_df)

        # Step 2: Schema Validation & Circuit Breaker
        validator = SchemaValidator(
            error_threshold=config.circuit_breaker_error_threshold
        )
        valid_df, quarantined_df = validator.validate(raw_df)
        metrics.records_validated = len(valid_df)
        metrics.quarantined_count = len(quarantined_df)

        # Step 3: Transformation, Cleansing & Deduplication
        transformer = DataTransformer(
            batch_id=batch_id,
            source_uri=config.gcs_source_uri,
        )
        transformed_df, dedup_count = transformer.transform(valid_df)
        metrics.duplicates_removed = dedup_count

        # Step 4: BigQuery Loading
        loader = BigQueryLoader(
            project_id=config.gcp_project_id,
            dataset_id=config.bigquery_dataset,
            table_name=config.bigquery_table,
            write_disposition=config.write_disposition,
        )
        loaded_count = loader.load(transformed_df)
        metrics.records_loaded = loaded_count

        # Telemetry & Completion
        metrics.execution_duration_ms = (time.time() - start_time) * 1000
        metrics.status = "SUCCESS"
        logger.info(
            "ETL Pipeline completed successfully in %.2f ms",
            metrics.execution_duration_ms,
            extra={"batch_id": batch_id, "metrics": metrics.__dict__},
        )
        return 0

    except SystemExit:
        raise
    except Exception as exc:
        metrics.execution_duration_ms = (time.time() - start_time) * 1000
        metrics.status = "FAILED"
        logger.critical(
            "ETL Pipeline execution failed: %s",
            exc,
            exc_info=True,
            extra={"batch_id": batch_id, "metrics": metrics.__dict__},
        )
        sys.exit(1)


if __name__ == "__main__":
    exit_code = run_pipeline()
    sys.exit(exit_code)
