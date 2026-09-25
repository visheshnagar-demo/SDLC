"""Main orchestrator for Cloud SQL PostgreSQL to BigQuery ETL batch job."""
import json
import logging
import sys
from datetime import datetime, timezone
from server.etl.config import ETLConfig
from server.etl.extractor import PostgresExtractor
from server.etl.transformer import DataTransformer
from server.etl.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("server.etl.main")


def run_pipeline() -> int:
    """Executes the ETL pipeline with end-to-end telemetry."""
    start_time = datetime.now(timezone.utc)
    logger.info("================ Starting ETL Pipeline (SCRUM-386) ================")

    try:
        config = ETLConfig.from_env()
        logger.info(
            "Config loaded: source=%s.%s, target=%s.%s.%s",
            config.postgres_db,
            config.postgres_table,
            config.gcp_project_id,
            config.bq_dataset,
            config.bq_table,
        )

        # Extraction
        extractor = PostgresExtractor(config)
        raw_df = extractor.extract()
        extracted_count = len(raw_df)

        # Transformation
        transformer = DataTransformer(config)
        clean_df = transformer.transform(raw_df)
        cleaned_count = len(clean_df)
        dropped_count = extracted_count - cleaned_count

        # Loading
        loader = BigQueryLoader(config)
        loaded_count = loader.load(clean_df)

        duration_sec = (datetime.now(timezone.utc) - start_time).total_seconds()
        metrics = {
            "status": "SUCCESS",
            "source_table": f"{config.postgres_db}.{config.postgres_table}",
            "target_table": f"{config.gcp_project_id}.{config.bq_dataset}.{config.bq_table}",
            "extracted_count": extracted_count,
            "cleaned_count": cleaned_count,
            "dropped_count": dropped_count,
            "loaded_count": loaded_count,
            "duration_seconds": round(duration_sec, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        logger.info("ETL Run Metrics:\n%s", json.dumps(metrics, indent=2))
        logger.info("================ ETL Pipeline Completed Successfully ================")
        return 0

    except Exception as exc:
        duration_sec = (datetime.now(timezone.utc) - start_time).total_seconds()
        failure_metrics = {
            "status": "FAILED",
            "error": str(exc),
            "duration_seconds": round(duration_sec, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        logger.critical("ETL Pipeline Failed:\n%s", json.dumps(failure_metrics, indent=2), exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    code = run_pipeline()
    sys.exit(code)
