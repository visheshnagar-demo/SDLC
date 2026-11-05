"""Main entrypoint for the Daily Batch ETL Pipeline Cloud Run Job."""

import argparse
import logging
import sys
from typing import Optional
import uuid
from server.config import settings
from server.extractor import Extractor
from server.loader import Loader
from server.models import ETLBatchMetrics
from server.transformer import Transformer

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("server.main")


def run_pipeline(
    gcs_uri: Optional[str] = None,
    destination_table: Optional[str] = None,
    batch_id: Optional[str] = None,
    extractor: Optional[Extractor] = None,
    transformer: Optional[Transformer] = None,
    loader: Optional[Loader] = None,
) -> ETLBatchMetrics:
    """Execute the end-to-end batch ETL data pipeline.

    Steps:
      1. Extract raw sales orders CSV from GCS (or local path).
      2. Clean, validate, and deduplicate records.
      3. Load clean records into partitioned BigQuery table.

    Args:
        gcs_uri: Source CSV URI (defaults to settings.GCS_SOURCE_URI).
        destination_table: Target BigQuery table ID (defaults to settings.bq_table_id).
        batch_id: Unique batch execution ID.
        extractor: Optional Extractor instance for dependency injection.
        transformer: Optional Transformer instance for dependency injection.
        loader: Optional Loader instance for dependency injection.

    Returns:
        ETLBatchMetrics summarising the batch processing run.
    """
    current_batch_id = batch_id or str(uuid.uuid4())
    source_uri = gcs_uri or settings.GCS_SOURCE_URI
    target_table = destination_table or settings.bq_table_id

    logger.info("==================================================")
    logger.info("Starting Daily Batch ETL Pipeline")
    logger.info("Batch ID:          %s", current_batch_id)
    logger.info("Source URI:        %s", source_uri)
    logger.info("Destination Table: %s", target_table)
    logger.info("==================================================")

    # 1. Extraction Phase
    ext = extractor or Extractor()
    raw_df = ext.extract(source_uri)

    if raw_df is None or raw_df.empty:
        logger.warning("Extraction returned no records. Exiting pipeline gracefully.")
        metrics = ETLBatchMetrics(
            batch_id=current_batch_id,
            raw_records=0,
            quarantined_records=0,
            deduplicated_records=0,
            clean_records_to_load=0,
        )
        logger.info("Batch %s finished with 0 records processed.", current_batch_id)
        return metrics

    # 2. Transformation Phase
    trans = transformer or Transformer(batch_id=current_batch_id)
    clean_df, metrics = trans.transform(raw_df, batch_id=current_batch_id)

    # 3. Loading Phase
    if clean_df is not None and not clean_df.empty:
        ld = loader or Loader()
        loaded_count = ld.load_records(clean_df, destination_table_id=target_table)
        logger.info(
            "Loaded %d clean records into BigQuery table %s", loaded_count, target_table
        )
    else:
        logger.warning("No clean records available to load into BigQuery.")

    logger.info("==================================================")
    logger.info("ETL Pipeline Execution Summary (Batch: %s):", current_batch_id)
    logger.info("  Raw Records Extracted:     %d", metrics.raw_records)
    logger.info("  Quarantined Records:       %d", metrics.quarantined_records)
    logger.info("  Deduplicated Records:      %d", metrics.deduplicated_records)
    logger.info("  Clean Records Loaded:      %d", metrics.clean_records_to_load)
    logger.info("==================================================")

    return metrics


def main() -> int:
    """CLI entrypoint for Cloud Run Job execution."""
    parser = argparse.ArgumentParser(
        description="Daily Batch ETL Pipeline for Sales Orders"
    )
    parser.add_argument(
        "--gcs-uri",
        type=str,
        default=None,
        help="GCS URI for input CSV file (e.g., gs://bucket/path.csv)",
    )
    parser.add_argument(
        "--destination-table",
        type=str,
        default=None,
        help="BigQuery destination table ID (e.g., project.dataset.table)",
    )
    parser.add_argument(
        "--batch-id",
        type=str,
        default=None,
        help="Optional custom batch UUID identifier",
    )
    args = parser.parse_args()

    try:
        metrics = run_pipeline(
            gcs_uri=args.gcs_uri,
            destination_table=args.destination_table,
            batch_id=args.batch_id,
        )
        logger.info("Batch run succeeded: %s", metrics.model_dump_json())
        return 0
    except Exception as e:
        logger.critical("Fatal error during ETL batch run: %s", e, exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
