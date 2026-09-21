"""Extractor module: streams and downloads CSV data from Google Cloud Storage."""
import io
import logging
import pandas as pd
from google.cloud import storage
from server.pipeline.config import PipelineConfig

logger = logging.getLogger(__name__)


class GCSExtractor:
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.client = storage.Client(project=self.config.gcp_project_id)

    def extract_to_dataframe(self) -> pd.DataFrame:
        """Downloads the source CSV file from GCS and returns a pandas DataFrame.
        
        Raises FileNotFoundError if the blob doesn't exist, or RuntimeError on failure.
        """
        logger.info(
            "Extracting source data from bucket=%s, prefix=%s",
            self.config.gcs_source_bucket,
            self.config.gcs_source_prefix,
        )
        bucket = self.client.bucket(self.config.gcs_source_bucket)
        blob = bucket.blob(self.config.gcs_source_prefix)

        if not blob.exists():
            # Check if there are blobs matching the prefix
            blobs = list(bucket.list_blobs(prefix=self.config.gcs_source_prefix))
            if not blobs:
                raise FileNotFoundError(
                    f"GCS object not found: gs://{self.config.gcs_source_bucket}/{self.config.gcs_source_prefix}"
                )
            blob = blobs[0]

        data_bytes = blob.download_as_bytes()
        if not data_bytes:
            raise ValueError(f"Source file in GCS is empty: gs://{self.config.gcs_source_bucket}/{blob.name}")

        df = pd.read_csv(io.BytesIO(data_bytes))
        logger.info("Successfully extracted %d raw records from GCS", len(df))
        return df
