"""Sales Order Batch ETL Pipeline Execution Entrypoint.

Cloud Run Job batch runner that extracts raw CSV from GCS, validates, cleans,
deduplicates, and loads into BigQuery partitioned table analytics.harshada-test2.
"""
import argparse
import sys
import time
from pipeline.ingestor import GCSIngestor
from pipeline.validator import DataValidator
from pipeline.transformer import DataTransformer
from pipeline.deduplicator import RecordDeduplicator
from pipeline.loader import BigQueryLoader
from pipeline.logger import get_logger, log_execution_summary

logger = get_logger("sales_etl.runner")


def run_pipeline(source_override: str = None) -> int:
    """Executes the full ETL pipeline. Returns exit code 0 on success."""
    start_time = time.time()
    logger.info("=== Starting Sales Order ETL Pipeline Execution ===")

    try:
        # 1. Ingestion
        ingestor = GCSIngestor()
        raw_df = ingestor.fetch_data(source_override=source_override)
        rows_extracted = len(raw_df)

        if rows_extracted == 0:
            logger.warning("Extraction yielded 0 rows. Pipeline completing early.")
            duration = time.time() - start_time
            log_execution_summary(
                logger,
                source_uri=f"gs://{ingestor.bucket_name}/{ingestor.source_prefix}",
                target_table="analytics.harshada-test2",
                rows_extracted=0,
                rows_cleaned=0,
                rows_quarantined=0,
                duplicates_removed=0,
                rows_loaded=0,
                duration_seconds=duration,
                status="SUCCESS",
            )
            return 0

        # 2. Validation
        validator = DataValidator()
        valid_df, quarantined_df = validator.validate(raw_df)
        rows_quarantined = len(quarantined_df)

        # 3. Transformation
        transformer = DataTransformer()
        transformed_df = transformer.transform(valid_df)
        rows_cleaned = len(transformed_df)

        if rows_cleaned == 0:
            logger.error("FATAL: 0 records survived transformation stage.")
            raise RuntimeError("FATAL: 0 records survived transformation stage.")

        # 4. Deduplication
        deduplicator = RecordDeduplicator(key_cols=["order_id"])
        clean_df, duplicates_removed = deduplicator.deduplicate(transformed_df)

        # 5. Loading
        loader = BigQueryLoader()
        rows_loaded = loader.load(clean_df)

        duration = time.time() - start_time
        log_execution_summary(
            logger,
            source_uri=f"gs://{ingestor.bucket_name}/{ingestor.source_prefix}",
            target_table=f"{loader.dataset_id}.{loader.table_id}",
            rows_extracted=rows_extracted,
            rows_cleaned=rows_cleaned,
            rows_quarantined=rows_quarantined,
            duplicates_removed=duplicates_removed,
            rows_loaded=rows_loaded,
            duration_seconds=duration,
            status="SUCCESS",
        )

        logger.info("=== Pipeline Execution Completed Successfully ===")
        return 0

    except SystemExit:
        raise
    except Exception as exc:
        duration = time.time() - start_time
        logger.critical("Pipeline execution failed: %s", exc, exc_info=True)
        log_execution_summary(
            logger,
            source_uri="gs://sdlc-workspec-store/etl/data/raw_sales_data.csv",
            target_table="analytics.harshada-test2",
            rows_extracted=0,
            rows_cleaned=0,
            rows_quarantined=0,
            duplicates_removed=0,
            rows_loaded=0,
            duration_seconds=duration,
            status="FAILED",
        )
        raise exc


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Sales ETL Pipeline")
    parser.add_argument("--source", help="Optional local CSV file override for testing", default=None)
    args = parser.parse_args()

    try:
        code = run_pipeline(source_override=args.source)
        sys.exit(code)
    except Exception as exc:
        logger.critical("Execution failed with error: %s", exc)
        sys.exit(1)
