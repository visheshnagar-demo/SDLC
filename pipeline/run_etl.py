"""ETL Pipeline Runner for SCRUM-333.
Extracts from GCS, executes rank sorting, currency conversion, timezone splitting, and loads to BigQuery.
"""
import os
import sys
import logging
import argparse
from pipeline.extractor import GCSExtractor
from pipeline.transformer import DataTransformer
from pipeline.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("pipeline.run_etl")


def run_pipeline(
    source_uri: str = None,
    exchange_rate: float = None,
    project_id: str = None,
    dataset_id: str = None,
    table_id: str = None,
) -> int:
    """Executes the end-to-end ETL pipeline."""
    source_uri = (
        source_uri
        or os.getenv("GCS_SOURCE_URI")
        or "gs://sdlc-workspec-store/etl/data/test_dynamic_etl_gmt.csv"
    )
    if exchange_rate is None:
        env_rate = os.getenv("EXCHANGE_RATE") or os.getenv("EXCHANGE_RATE_USD_TO_INR")
        exchange_rate = float(env_rate) if env_rate else 83.5

    project_id = (
        project_id
        or os.getenv("GCP_PROJECT_ID")
        or os.getenv("PROJECT_ID")
        or "upbeat-repeater-477110-q6"
    )
    dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET", "analytics")
    table_id = table_id or os.getenv("BIGQUERY_TABLE", "test3")

    logger.info("Starting ETL Pipeline Execution for SCRUM-333")
    logger.info("Source: %s", source_uri)
    logger.info("Target: %s.%s.%s", project_id, dataset_id, table_id)
    logger.info("Exchange Rate (USD to INR): %s", exchange_rate)

    try:
        extractor = GCSExtractor(gcs_uri=source_uri)
        df_raw = extractor.extract()
        logger.info("Extraction completed. Extracted %d raw rows.", len(df_raw))

        transformer = DataTransformer(exchange_rate=exchange_rate)
        df_transformed = transformer.transform(df_raw)
        logger.info("Transformation completed. Transformed %d rows.", len(df_transformed))

        if len(df_raw) > 0 and len(df_transformed) == 0:
            logger.error("Circuit Breaker Triggered: All rows were filtered out during transformation.")
            sys.exit(1)

        loader = BigQueryLoader(
            project_id=project_id,
            dataset_id=dataset_id,
            table_id=table_id,
        )
        loaded_count = loader.load(df_transformed)
        logger.info("Successfully loaded %d rows to BigQuery table %s.%s.%s", loaded_count, project_id, dataset_id, table_id)
        return 0
    except Exception as exc:
        logger.critical("Fatal error in ETL pipeline execution: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ETL Pipeline Runner for SCRUM-333")
    parser.add_argument("--source-uri", help="GCS Source URI", default=None)
    parser.add_argument("--exchange-rate", type=float, help="USD to INR exchange rate", default=None)
    parser.add_argument("--project-id", help="Target GCP Project ID", default=None)
    parser.add_argument("--dataset-id", help="Target BigQuery Dataset", default=None)
    parser.add_argument("--table-id", help="Target BigQuery Table", default=None)

    args = parser.parse_args()
    code = run_pipeline(
        source_uri=args.source_uri,
        exchange_rate=args.exchange_rate,
        project_id=args.project_id,
        dataset_id=args.dataset_id,
        table_id=args.table_id,
    )
    sys.exit(code)
