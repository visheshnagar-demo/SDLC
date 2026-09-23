"""ETL Pipeline Coordinator Module."""
import time
import logging
from typing import Dict, Any, Optional
from server.etl.extractor import PostgresExtractor
from server.etl.cleaner import DataCleaner
from server.etl.loader import BigQueryLoader

logger = logging.getLogger(__name__)


class ETLPipeline:
    """Coordinates end-to-end extraction, transformation, and BigQuery loading."""

    def __init__(
        self,
        extractor: Optional[PostgresExtractor] = None,
        cleaner: Optional[DataCleaner] = None,
        loader: Optional[BigQueryLoader] = None
    ):
        self.extractor = extractor or PostgresExtractor()
        self.cleaner = cleaner or DataCleaner()
        self.loader = loader or BigQueryLoader()

    def run(self, source_table: str = "test_data") -> Dict[str, Any]:
        """Executes the full batch ETL cycle and returns execution metrics."""
        start_time = time.time()
        logger.info("Initiating ETL cycle for source table '%s'...", source_table)

        # 1. Extraction Phase
        raw_df = self.extractor.extract(table_name=source_table)
        extracted_count = len(raw_df)

        # 2. Transformation Phase
        clean_df = self.cleaner.clean(raw_df)
        cleaned_count = len(clean_df)
        dropped_count = extracted_count - cleaned_count

        # 3. Loading Phase
        loaded_count = self.loader.load(clean_df)

        duration = time.time() - start_time
        summary = {
            "status": "SUCCESS",
            "source_table": source_table,
            "target_table": f"{self.loader.dataset_id}.{self.loader.table_id}",
            "metrics": {
                "rows_extracted": extracted_count,
                "rows_cleaned": cleaned_count,
                "rows_dropped": dropped_count,
                "rows_loaded": loaded_count
            },
            "duration_seconds": round(duration, 3)
        }

        logger.info("ETL Execution Summary: %s", summary)
        return summary
