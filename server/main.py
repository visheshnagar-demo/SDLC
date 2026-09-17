"""Main entry point for Sales Order Batch ETL Cloud Run Job."""

import argparse
from datetime import datetime, timezone
import json
import logging
import sys
import uuid
from typing import Optional

from server.config import get_config
from server.extractor import GCSExtractor
from server.loader import BigQueryLoader
from server.transformer import SalesOrderTransformer


def setup_logging(log_level: str = "INFO"):
    """Configures structured JSON-friendly logging."""
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ",
        stream=sys.stdout,
    )


def log_structured_metric(stage: str, batch_id: str, severity: str = "INFO", metrics: Optional[dict] = None, error: Optional[str] = None):
    """Emits structured JSON log for Cloud Logging / Monitoring."""
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "severity": severity,
        "batch_id": batch_id,
        "stage": stage,
    }
    if metrics:
        payload["metrics"] = metrics
    if error:
        payload["error"] = error
    print(json.dumps(payload), file=sys.stdout)


def parse_args():
    """Parses command line arguments."""
    parser = argparse.ArgumentParser(description="Sales Order Batch ETL Pipeline")
    parser.add_argument("--source-uri", type=str, default=None, help="GCS URI for input CSV")
    parser.add_argument("--destination-table", type=str, default=None, help="Destination dataset.table in BigQuery")
    parser.add_argument("--project-id", type=str, default=None, help="GCP Project ID")
    parser.add_argument("--batch-id", type=str, default=None, help="Unique identifier for the ETL batch")
    return parser.parse_args()


def run_pipeline(source_uri: str, project_id: str, dataset_id: str, table_id: str, batch_id: str) -> int:
    """Executes the end-to-end batch ETL pipeline.

    Args:
        source_uri: GCS source URI.
        project_id: GCP Project ID.
        dataset_id: BigQuery dataset.
        table_id: BigQuery table name.
        batch_id: Unique batch execution ID.

    Returns:
        Exit code: 0 on success, 1 on failure.
    """
    logger = logging.getLogger("sales_etl.main")
    logger.info(f"Starting ETL batch execution {batch_id} (Source: {source_uri}, Target: {project_id}.{dataset_id}.{table_id})")

    try:
        # Step 1: Extract
        extractor = GCSExtractor()
        raw_records = extractor.extract_csv(source_uri)
        log_structured_metric(
            stage="EXTRACTION_COMPLETE",
            batch_id=batch_id,
            metrics={"raw_records_extracted": len(raw_records)},
        )

        # Step 2: Transform
        transformer = SalesOrderTransformer(batch_id=batch_id)
        clean_records, metrics, quarantined = transformer.transform(raw_records)
        log_structured_metric(
            stage="TRANSFORMATION_COMPLETE",
            batch_id=batch_id,
            metrics={
                "raw_records": metrics.raw_records,
                "quarantined_records": metrics.quarantined_records,
                "deduplicated_records": metrics.deduplicated_records,
                "clean_records_to_load": metrics.clean_records_to_load,
            },
        )

        # Step 3: Load
        loader = BigQueryLoader(project_id=project_id)
        rows_loaded = loader.load_records(clean_records, dataset_id=dataset_id, table_id=table_id)
        log_structured_metric(
            stage="LOAD_COMPLETE",
            batch_id=batch_id,
            metrics={"rows_loaded_to_bigquery": rows_loaded},
        )

        logger.info(f"ETL batch {batch_id} completed successfully. Total rows loaded: {rows_loaded}")
        return 0

    except FileNotFoundError as fnf_err:
        logger.error(f"ETL batch {batch_id} failed: File not found - {str(fnf_err)}")
        log_structured_metric(
            stage="PIPELINE_FAILED",
            batch_id=batch_id,
            severity="ERROR",
            error=str(fnf_err),
        )
        return 1

    except Exception as err:
        logger.error(f"ETL batch {batch_id} encountered fatal error: {str(err)}", exc_info=True)
        log_structured_metric(
            stage="PIPELINE_FAILED",
            batch_id=batch_id,
            severity="ERROR",
            error=str(err),
        )
        return 1


def main():
    """CLI execution entrypoint."""
    args = parse_args()
    config = get_config()
    setup_logging(config.log_level)

    source_uri = args.source_uri or config.source_gcs_uri
    project_id = args.project_id or config.project_id
    batch_id = args.batch_id or f"batch-{uuid.uuid4().hex[:8]}"

    # Parse dataset and table if passed as dataset.table
    if args.destination_table:
        parts = args.destination_table.split(".")
        if len(parts) == 2:
            dataset_id, table_id = parts
        elif len(parts) == 3:
            project_id, dataset_id, table_id = parts
        else:
            dataset_id = config.destination_dataset
            table_id = args.destination_table
    else:
        dataset_id = config.destination_dataset
        table_id = config.destination_table

    exit_code = run_pipeline(
        source_uri=source_uri,
        project_id=project_id,
        dataset_id=dataset_id,
        table_id=table_id,
        batch_id=batch_id,
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
