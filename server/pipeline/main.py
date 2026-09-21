"""Main entry point for the GCS to BigQuery ETL pipeline."""
import sys
import logging
from server.pipeline.config import get_config
from server.pipeline.extractor import GCSExtractor
from server.pipeline.transformer import DataTransformer
from server.pipeline.circuit_breaker import CircuitBreaker
from server.pipeline.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("pipeline.main")


def run_pipeline() -> int:
    """Executes the full ETL cycle: extract -> transform -> circuit breaker -> load."""
    logger.info("=== Initializing ETL Pipeline for SCRUM-330 ===")
    config = get_config()
    logger.info(
        "GCP Project: %s | Dataset: %s | Table: %s | Source URI: %s",
        config.gcp_project_id,
        config.bq_dataset,
        config.bq_table,
        config.gcs_source_uri,
    )

    extractor = GCSExtractor(config)
    transformer = DataTransformer(config)
    circuit_breaker = CircuitBreaker(config)
    loader = BigQueryLoader(config)

    # 1. Extraction
    df_raw = extractor.extract_to_dataframe()
    raw_count = len(df_raw)

    # 2. Transformation
    df_transformed = transformer.transform(df_raw)

    # 3. Circuit breaker validation
    df_valid = circuit_breaker.validate(raw_count, df_transformed)

    # 4. Loading to BigQuery
    rows_loaded = loader.load_dataframe(df_valid, write_disposition="WRITE_TRUNCATE")

    logger.info(
        "=== Pipeline Completed Successfully: %d raw rows -> %d rows loaded to %s.%s.%s ===",
        raw_count,
        rows_loaded,
        config.gcp_project_id,
        config.bq_dataset,
        config.bq_table,
    )
    return 0


if __name__ == "__main__":
    status = run_pipeline()
    sys.exit(status)
