"""ETL Pipeline Execution Entrypoint.

Orchestrates Cloud SQL PostgreSQL extraction, data cleaning/transformation,
circuit breaker validation, and BigQuery target ingestion.
"""
import argparse
import json
import logging
import sys
import time
import uuid

from server.config import get_settings
from server.extractor import PostgreSQLExtractor
from server.transformer import DataTransformer
from server.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
)
logger = logging.getLogger("server.etl_pipeline")


def run_pipeline(
    source_table: str | None = None,
    target_table: str | None = None,
    write_mode: str | None = None,
    batch_id: str | None = None,
    circuit_breaker_threshold: float | None = None,
) -> int:
    """Executes the end-to-end ETL pipeline."""
    start_time = time.time()
    batch_id = batch_id or str(uuid.uuid4())
    settings = get_settings()

    if source_table:
        settings.source_table = source_table
    if target_table:
        parts = target_table.split(".")
        if len(parts) == 2:
            settings.bigquery_dataset, settings.bigquery_table = parts
        elif len(parts) == 3:
            settings.gcp_project_id, settings.bigquery_dataset, settings.bigquery_table = parts
        else:
            settings.bigquery_table = target_table
    if write_mode:
        settings.write_disposition = (
            "WRITE_APPEND" if write_mode.lower() == "append" else "WRITE_TRUNCATE"
        )
    if circuit_breaker_threshold is not None:
        settings.circuit_breaker_threshold = circuit_breaker_threshold

    logger.info(
        "Starting ETL Pipeline: Source=%s, Target=%s.%s, WriteMode=%s, BatchID=%s",
        settings.source_table,
        settings.bigquery_dataset,
        settings.bigquery_table,
        settings.write_disposition,
        batch_id,
    )

    extractor = PostgreSQLExtractor(settings)
    transformer = DataTransformer(settings, batch_id=batch_id)
    loader = BigQueryLoader(settings)

    try:
        # 1. Extraction Phase
        df_raw, discovered_schema = extractor.extract_data(settings.source_table)

        # 2. Transformation Phase
        try:
            df_cleaned, df_quarantine, metrics = transformer.transform(
                df_raw, discovered_schema=discovered_schema
            )
        except RuntimeError as cb_err:
            if "Circuit breaker tripped" in str(cb_err):
                logger.error("Circuit breaker tripped: %s", cb_err)
                sys.exit(2)
            raise

        # 3. Loading Phase
        load_result = loader.load_dataframe(
            df=df_cleaned,
            dataset_id=settings.bigquery_dataset,
            table_id=settings.bigquery_table,
            write_disposition=settings.write_disposition,
        )

        duration_ms = int((time.time() - start_time) * 1000)
        summary = {
            "status": "SUCCESS",
            "batch_id": batch_id,
            "duration_ms": duration_ms,
            "metrics": {
                "extracted": metrics.get("extracted", 0),
                "cleaned": metrics.get("cleaned", 0),
                "duplicates_dropped": metrics.get("duplicates_dropped", 0),
                "quarantined": metrics.get("quarantined", 0),
                "loaded": load_result.get("loaded_rows", 0),
            },
        }
        logger.info("ETL Pipeline completed successfully: %s", json.dumps(summary))
        return 0

    except SystemExit:
        raise
    except Exception as exc:
        logger.critical("Fatal error during ETL pipeline execution: %s", exc, exc_info=True)
        sys.exit(1)
    finally:
        extractor.close()


def main():
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(description="Cloud SQL PostgreSQL to BigQuery ETL Pipeline")
    parser.add_argument("--source-table", type=str, default=None, help="Source PostgreSQL table name")
    parser.add_argument("--target-table", type=str, default=None, help="Target BigQuery table (dataset.table)")
    parser.add_argument("--write-mode", type=str, default=None, choices=["append", "truncate"], help="Write mode")
    parser.add_argument("--batch-id", type=str, default=None, help="ETL Batch Run UUID")
    parser.add_argument("--circuit-breaker-threshold", type=float, default=None, help="Max corrupt row ratio (e.g. 0.05)")

    args = parser.parse_args()

    exit_code = run_pipeline(
        source_table=args.source_table,
        target_table=args.target_table,
        write_mode=args.write_mode,
        batch_id=args.batch_id,
        circuit_breaker_threshold=args.circuit_breaker_threshold,
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
