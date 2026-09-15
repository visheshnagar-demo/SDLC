"""ETL Pipeline orchestrator and runner."""
from datetime import datetime
import json
import logging
import time
from typing import Any, Dict, List, Optional
from uuid import uuid4

from server.etl.extractor import PostgreSQLExtractor
from server.etl.loader import BigQueryLoader
from server.etl.transformer import DataTransformer
from server.etl.validator import DataValidator
from server.models import PipelineRunResult

logger = logging.getLogger("server.etl.runner")


class ETLRunner:
    """Orchestrates the PostgreSQL to BigQuery ETL sales pipeline."""

    def __init__(
        self,
        extractor: Optional[PostgreSQLExtractor] = None,
        validator: Optional[DataValidator] = None,
        transformer: Optional[DataTransformer] = None,
        loader: Optional[BigQueryLoader] = None,
        pipeline_run_id: Optional[str] = None,
    ):
        self.pipeline_run_id = pipeline_run_id or str(uuid4())
        self.extractor = extractor or PostgreSQLExtractor()
        self.validator = validator or DataValidator()
        self.transformer = transformer or DataTransformer(pipeline_run_id=self.pipeline_run_id)
        self.loader = loader or BigQueryLoader()

    def run(self, dry_run: bool = False) -> PipelineRunResult:
        """Executes the complete ETL pipeline."""
        start_time = time.time()
        logger.info("=== Starting ETL Pipeline Run [ID: %s] ===", self.pipeline_run_id)

        try:
            # Step 1: Extraction
            raw_records = self.extractor.extract_all()
            extracted_count = len(raw_records)

            # Step 2: Validation & Cleansing
            val_result = self.validator.validate_batch(raw_records)

            # Step 3: Transformation
            transformed_records = self.transformer.transform_batch(val_result.valid_records)

            # Step 4: Loading
            loaded_count = 0
            if not dry_run and transformed_records:
                self.loader.ensure_table_exists()
                loaded_count = self.loader.load_records(transformed_records)
            elif dry_run:
                logger.info("[Dry Run] Skipping target BigQuery load.")
                loaded_count = len(transformed_records)

            duration_ms = int((time.time() - start_time) * 1000)

            result = PipelineRunResult(
                pipeline_run_id=self.pipeline_run_id,
                status="SUCCESS",
                extracted_records=extracted_count,
                filtered_missing_amount=val_result.filtered_missing_amount_count,
                filtered_invalid_email=val_result.filtered_invalid_email_count,
                loaded_records=loaded_count,
                duration_ms=duration_ms,
                quarantined_records=val_result.quarantined_records if val_result.quarantined_records else None,
            )

            # Emit structured JSON audit log
            logger.info("ETL Execution Summary: %s", json.dumps(result.model_dump()))
            return result

        except Exception as exc:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.critical("ETL Pipeline FAILED [ID: %s]: %s", self.pipeline_run_id, exc, exc_info=True)
            return PipelineRunResult(
                pipeline_run_id=self.pipeline_run_id,
                status="FAILED",
                duration_ms=duration_ms,
                error_message=str(exc),
            )


def run_etl_pipeline(
    session: Optional[Any] = None,
    bq_client: Optional[Any] = None,
    dry_run: bool = False,
    run_id: Optional[str] = None,
) -> PipelineRunResult:
    """Convenience functional entry point for executing the pipeline."""
    extractor = PostgreSQLExtractor(session=session) if session else PostgreSQLExtractor()
    loader = BigQueryLoader(client=bq_client) if bq_client else BigQueryLoader()
    runner = ETLRunner(extractor=extractor, loader=loader, pipeline_run_id=run_id)
    return runner.run(dry_run=dry_run)
