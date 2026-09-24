"""Main entry point for running the GCS to BigQuery ETL pipeline."""

import argparse
import json
import logging
import os
import sys
import time
from typing import Optional

from pipeline.circuit_breaker import CircuitBreaker
from pipeline.extractor import GCSExtractor
from pipeline.loader import BigQueryLoader
from pipeline.transformer import DataTransformer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("etl_runner")


def run_etl(
    source_uri: str,
    project_id: str,
    dataset_id: str,
    table_id: str,
    write_disposition: str = "WRITE_TRUNCATE",
    schema_path: Optional[str] = None,
) -> dict:
    """Executes the complete ETL workflow."""
    start_time = time.time()
    circuit_breaker = CircuitBreaker()

    try:
        # Step 1: Extraction
        extractor = GCSExtractor(project_id=project_id)
        raw_df = extractor.extract(source_path=source_uri)

        # Step 2: Transformation & Validation
        transformer = DataTransformer(circuit_breaker=circuit_breaker)
        clean_df = transformer.transform(raw_df=raw_df, source_file=source_uri)

        # Step 3: Loading
        loader = BigQueryLoader(
            project_id=project_id,
            dataset_id=dataset_id,
            table_id=table_id,
        )

        resolved_schema = schema_path
        if not resolved_schema:
            default_schema = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "schemas",
                f"{table_id}_schema.json",
            )
            if os.path.exists(default_schema):
                resolved_schema = default_schema

        rows_loaded = loader.load(
            df=clean_df,
            write_disposition=write_disposition,
            schema_file_path=resolved_schema,
        )

        duration = round(time.time() - start_time, 2)
        summary = {
            "event": "etl_job_completed",
            "source_file": source_uri,
            "target_table": f"{project_id}.{dataset_id}.{table_id}",
            "rows_extracted": circuit_breaker.rows_extracted,
            "rows_cleaned": circuit_breaker.rows_cleaned,
            "rows_quarantined": circuit_breaker.rows_quarantined,
            "rows_loaded": rows_loaded,
            "duration_seconds": duration,
            "status": "SUCCESS",
        }
        logger.info("ETL Pipeline completed successfully: %s", json.dumps(summary))
        return summary

    except Exception as exc:
        duration = round(time.time() - start_time, 2)
        summary = {
            "event": "etl_job_failed",
            "source_file": source_uri,
            "target_table": f"{project_id}.{dataset_id}.{table_id}",
            "rows_extracted": circuit_breaker.rows_extracted,
            "rows_cleaned": circuit_breaker.rows_cleaned,
            "rows_quarantined": circuit_breaker.rows_quarantined,
            "rows_loaded": 0,
            "duration_seconds": duration,
            "status": "FAILED",
            "error": str(exc),
        }
        logger.error("ETL Pipeline execution failed: %s", json.dumps(summary), exc_info=True)
        raise exc


def main() -> None:
    """CLI Argument Parser and entry execution."""
    parser = argparse.ArgumentParser(description="GCS to BigQuery ETL Job")
    parser.add_argument(
        "--source",
        default=os.getenv("SOURCE_GCS_URI", "gs://sdlc-workspec-store/etl/data/my_file (1).csv"),
        help="Source GCS URI or local path",
    )
    parser.add_argument(
        "--project",
        default=os.getenv("GCP_PROJECT", "upbeat-repeater-477110-q6"),
        help="Google Cloud Project ID",
    )
    parser.add_argument(
        "--dataset",
        default=os.getenv("BIGQUERY_DATASET", "analytics"),
        help="Target BigQuery Dataset ID",
    )
    parser.add_argument(
        "--table",
        default=os.getenv("BIGQUERY_TABLE", "test01"),
        help="Target BigQuery Table ID",
    )
    parser.add_argument(
        "--write-disposition",
        default=os.getenv("WRITE_DISPOSITION", "WRITE_TRUNCATE"),
        help="BigQuery Write Disposition (WRITE_TRUNCATE or WRITE_APPEND)",
    )
    parser.add_argument(
        "--schema",
        default=None,
        help="Path to BigQuery JSON schema definition file",
    )

    args = parser.parse_args()

    try:
        summary = run_etl(
            source_uri=args.source,
            project_id=args.project,
            dataset_id=args.dataset,
            table_id=args.table,
            write_disposition=args.write_disposition,
            schema_path=args.schema,
        )
        print(json.dumps(summary, indent=2))
        sys.exit(0)
    except Exception as exc:
        print(json.dumps({"status": "FAILED", "error": str(exc)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
