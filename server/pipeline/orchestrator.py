"""End-to-end pipeline orchestrator for Cloud SQL to BigQuery ETL."""
import time
from typing import Dict, Any
from server.config import ETLConfig, get_config
from server.pipeline.extractor import PostgreSQLExtractor
from server.pipeline.transformer import DataCleanerTransformer
from server.pipeline.loader import BigQueryLoader
from server.utils.logger import get_logger
from server.utils.exceptions import ETLException

logger = get_logger("sdlc-etl-orchestrator")


class PipelineOrchestrator:
    """Orchestrates end-to-end extraction, transformation, and loading workflow."""

    def __init__(
        self,
        config: ETLConfig = None,
        extractor: PostgreSQLExtractor = None,
        transformer: DataCleanerTransformer = None,
        loader: BigQueryLoader = None,
    ):
        self.config = config or get_config()
        self.extractor = extractor or PostgreSQLExtractor(self.config)
        self.transformer = transformer or DataCleanerTransformer(self.config)
        self.loader = loader or BigQueryLoader(self.config)

    def run(self) -> Dict[str, Any]:
        """Runs the ETL pipeline and returns execution telemetry metrics."""
        start_time = time.time()
        pipeline_name = "cloudsql_postgres_to_bigquery_etl"
        logger.info("Starting pipeline execution for %s", pipeline_name)

        metrics = {
            "pipeline_name": pipeline_name,
            "rows_extracted": 0,
            "rows_cleaned": 0,
            "rows_loaded": 0,
            "execution_time_seconds": 0.0,
            "status": "FAILED",
        }

        try:
            # Step 1: Extraction
            extracted_df = self.extractor.extract()
            metrics["rows_extracted"] = len(extracted_df)

            # Step 2: Transformation
            cleaned_df = self.transformer.transform(extracted_df)
            metrics["rows_cleaned"] = len(cleaned_df)

            # Step 3: Loading
            rows_loaded = self.loader.load(cleaned_df)
            metrics["rows_loaded"] = rows_loaded

            metrics["status"] = "SUCCESS"
            metrics["execution_time_seconds"] = round(time.time() - start_time, 3)
            logger.info("Pipeline completed successfully: %s", metrics)
            return metrics

        except ETLException as exc:
            metrics["execution_time_seconds"] = round(time.time() - start_time, 3)
            logger.error("Pipeline failed with ETL domain exception: %s", exc)
            raise
        except Exception as exc:
            metrics["execution_time_seconds"] = round(time.time() - start_time, 3)
            logger.critical("Pipeline failed with unhandled error: %s", exc, exc_info=True)
            raise
