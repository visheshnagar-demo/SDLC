"""ETL Pipeline Coordinator orchestrating extraction, transformation, and loading."""
import os
import sys
import time
import uuid
from typing import Optional

try:
    import pandas as pd
except ImportError:
    pd = None

from server.etl.extractor import CloudSQLExtractor
from server.etl.loader import BigQueryLoader
from server.etl.observability import AuditMetrics, logger
from server.etl.transformer import DataTransformer


class ETLPipeline:
    """Orchestrates end-to-end extraction from Cloud SQL PostgreSQL and loading to BigQuery."""

    def __init__(
        self,
        source_table: Optional[str] = None,
        target_dataset: Optional[str] = None,
        target_table: Optional[str] = None,
        extractor: Optional[CloudSQLExtractor] = None,
        transformer: Optional[DataTransformer] = None,
        loader: Optional[BigQueryLoader] = None,
    ):
        self.source_table = source_table or os.getenv("SOURCE_TABLE", "test_data")
        self.target_dataset = target_dataset or os.getenv("BIGQUERY_DATASET", "analytics")
        self.target_table = target_table or os.getenv("BIGQUERY_TABLE", "postgres_test2")

        self.extractor = extractor or CloudSQLExtractor()
        self.transformer = transformer or DataTransformer()
        self.loader = loader or BigQueryLoader(
            dataset_id=self.target_dataset, table_name=self.target_table
        )

    def run(self) -> AuditMetrics:
        """Executes the complete ETL lifecycle and returns execution audit metrics."""
        job_id = str(uuid.uuid4())
        start_time = time.time()
        metrics = AuditMetrics(
            job_id=job_id,
            source_table=self.source_table,
            target_table=f"{self.target_dataset}.{self.target_table}",
        )

        logger.info(
            "Starting ETL Pipeline run",
            job_id=job_id,
            source_table=self.source_table,
            target_table=f"{self.target_dataset}.{self.target_table}",
        )

        try:
            # Step 1: Extraction
            df_raw = self.extractor.extract_table(table_name=self.source_table)
            metrics.rows_extracted = len(df_raw)

            # Step 2: Transformation & Cleaning
            df_cleaned, stats, quarantined = self.transformer.clean_and_normalize(df_raw)
            metrics.rows_cleaned = stats["rows_cleaned"]
            metrics.rows_deduplicated = stats["rows_deduplicated"]
            metrics.rows_dropped_or_quarantined = stats["rows_dropped"]
            metrics.quarantined_records = quarantined

            # Step 3: BigQuery Load
            rows_loaded = self.loader.load_dataframe(df_cleaned)
            metrics.rows_loaded = rows_loaded

            # Pipeline Success
            metrics.status = "SUCCESS"
            metrics.execution_duration_sec = round(time.time() - start_time, 3)
            logger.info("ETL Pipeline completed successfully", **metrics.to_dict())
            logger.emit_audit(metrics)
            return metrics

        except Exception as e:
            metrics.status = "FAILED"
            metrics.error_message = str(e)
            metrics.execution_duration_sec = round(time.time() - start_time, 3)
            logger.error(
                "ETL Pipeline execution failed",
                job_id=job_id,
                error=str(e),
                duration=metrics.execution_duration_sec,
            )
            logger.emit_audit(metrics)
            raise


def main() -> int:
    """CLI entrypoint returning exit code 0 for success, 1 for failure."""
    try:
        pipeline = ETLPipeline()
        metrics = pipeline.run()
        if metrics.status != "SUCCESS":
            sys.exit(1)
        return 0
    except Exception as e:
        logger.error(f"Fatal error in ETL pipeline: {e}")
        sys.exit(1)


if __name__ == "__main__":
    sys.exit(main())
