"""Main entrypoint for the Cloud Run Job ETL Pipeline.
Executes GCS extraction, cleaning/deduplication, and partitioned BigQuery loading.
Exits 0 on success, 1 on failure.
"""
import sys
import os
import json
import logging
from server.etl.config import ETLConfig
from server.etl.ingest import extract_sales_data_from_gcs
from server.etl.transform import transform_and_deduplicate
from server.etl.loader import load_to_bigquery


def setup_logging(level: str = "INFO"):
    logging.basicConfig(
        level=getattr(logging, level, logging.INFO),
        format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    )


def run_etl() -> int:
    config = ETLConfig()
    setup_logging(config.log_level)
    logger = logging.getLogger("server.main")
    logger.info("Starting Cloud Run Job ETL execution for issue SCRUM-390...")
    logger.info("Config: source=gs://%s/%s, target=%s", config.gcs_bucket_name, config.gcs_source_blob, config.target_table_ref)

    try:
        # Step 1: Ingest
        df_raw = extract_sales_data_from_gcs(
            bucket_name=config.gcs_bucket_name,
            blob_path=config.gcs_source_blob,
        )

        # Step 2: Transform and Deduplicate
        df_clean, metrics = transform_and_deduplicate(df_raw)

        # Step 3: Schema resolution
        schema_path = None
        for candidate in [
            os.path.join("schemas", f"{config.bq_table_id}_schema.json"),
            os.path.join("schemas", "harshada-test4_schema.json"),
            os.path.join("schemas", "harshada_test4_schema.json"),
        ]:
            if os.path.isfile(candidate):
                schema_path = candidate
                break

        # Step 4: Load to BigQuery
        records_loaded = load_to_bigquery(
            df=df_clean,
            project_id=config.gcp_project_id,
            dataset_id=config.bq_dataset_id,
            table_id=config.bq_table_id,
            write_mode=config.write_mode,
            schema_path=schema_path,
        )

        metrics["records_loaded"] = records_loaded
        metrics["status"] = "SUCCESS"
        logger.info("ETL Execution Summary: %s", json.dumps(metrics))
        return 0

    except Exception as exc:
        logger.critical("FATAL: ETL Pipeline failed with error: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    exit_code = run_etl()
    sys.exit(exit_code)
