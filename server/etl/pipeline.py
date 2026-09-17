"""ETL Pipeline Orchestration Module."""
import time
import io
import csv
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

try:
    import pandas as pd
except ImportError:
    pd = None

from server.etl.extractor import GCSExtractor
from server.etl.transformer import DataTransformer
from server.etl.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


class ETLPipeline:
    """Orchestrates end-to-end Extract -> Transform -> Load pipeline."""

    def __init__(
        self,
        extractor: Optional[GCSExtractor] = None,
        transformer: Optional[DataTransformer] = None,
        loader: Optional[BigQueryLoader] = None,
        write_disposition: str = "WRITE_APPEND",
    ):
        self.extractor = extractor or GCSExtractor()
        self.transformer = transformer or DataTransformer(source_file=self.extractor.source_uri)
        self.loader = loader or BigQueryLoader()
        self.write_disposition = write_disposition

    def run(self, raw_csv_override: Optional[str] = None) -> Dict[str, Any]:
        """Runs the ETL lifecycle and returns execution summary."""
        start_time = time.time()
        start_ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        logger.info("Starting ETL Pipeline Execution: %s -> %s", self.extractor.source_uri, self.loader.target_table_ref)

        summary: Dict[str, Any] = {
            "status": "FAILED",
            "gcs_source": self.extractor.source_uri,
            "target_table": self.loader.target_table_ref,
            "rows_extracted": 0,
            "rows_transformed": 0,
            "rows_rejected": 0,
            "rows_loaded": 0,
            "duration_seconds": 0.0,
            "timestamp": start_ts,
        }

        try:
            # 1. Extraction Phase
            if raw_csv_override is not None:
                if pd is not None:
                    data = pd.read_csv(io.StringIO(raw_csv_override), dtype=str, keep_default_na=False)
                else:
                    data = list(csv.DictReader(io.StringIO(raw_csv_override)))
            else:
                data = self.extractor.extract_dataframe()

            summary["rows_extracted"] = len(data)
            logger.info("Extraction stage complete. Extracted %d records.", len(data))

            # 2. Transformation Phase
            transform_result = self.transformer.transform(data)
            summary["rows_transformed"] = transform_result.rows_transformed
            summary["rows_rejected"] = transform_result.rows_rejected
            logger.info(
                "Transformation complete: %d valid records, %d rejected.",
                transform_result.rows_transformed,
                transform_result.rows_rejected,
            )

            # 3. Loading Phase
            self.loader.ensure_dataset_and_tables()

            loaded_count = self.loader.load_transformed_records(
                transform_result.valid_records,
                write_disposition=self.write_disposition,
            )
            summary["rows_loaded"] = loaded_count

            if transform_result.error_records:
                self.loader.load_error_records(transform_result.error_records)

            summary["status"] = "SUCCESS"

        except Exception as exc:
            logger.error("ETL Pipeline failed with error: %s", exc, exc_info=True)
            summary["status"] = "FAILED"
            summary["error"] = str(exc)

        finally:
            duration = round(time.time() - start_time, 2)
            summary["duration_seconds"] = duration
            logger.info("Pipeline execution finished with status: %s (Duration: %ss)", summary["status"], duration)

        return summary


if __name__ == "__main__":
    pipeline = ETLPipeline()
    result = pipeline.run()
    import json
    print(json.dumps(result, indent=2))
