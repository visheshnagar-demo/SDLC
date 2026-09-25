"""GCS Source Extractor module."""
import io
import logging
import os
import time
from typing import Tuple
from urllib.parse import urlparse
from server.compat import pd, storage
from server.config import PipelineConfig
from server.models import ExtractionSummary

logger = logging.getLogger(__name__)


class GCSSourceExtractor:
    """Extracts raw CSV datasets from Google Cloud Storage."""

    def __init__(self, config: PipelineConfig, storage_client: storage.Client = None):
        self.config = config
        self._client = storage_client

    @property
    def client(self) -> storage.Client:
        if self._client is None:
            self._client = storage.Client(project=self.config.project_id)
        return self._client

    def _parse_gcs_uri(self, uri: str) -> Tuple[str, str]:
        """Parses bucket name and blob path from a gs:// URI."""
        if not uri.startswith("gs://"):
            raise ValueError(f"Invalid GCS URI: {uri}. Expected format 'gs://bucket_name/path/to/file.csv'")
        parsed = urlparse(uri)
        bucket_name = parsed.netloc
        blob_path = parsed.path.lstrip("/")
        if not bucket_name or not blob_path:
            raise ValueError(f"Failed to parse bucket or blob path from URI: {uri}")
        return bucket_name, blob_path

    def extract(self) -> Tuple[pd.DataFrame, ExtractionSummary]:
        """Extracts data from GCS with retry mechanism."""
        uri = self.config.source_gcs_uri
        logger.info("Starting extraction from: %s", uri)

        # Allow local path for testing if non-GCS
        if os.path.exists(uri):
            df = pd.read_csv(uri)
            file_size = os.path.getsize(uri)
            summary = ExtractionSummary(
                source_uri=uri,
                raw_row_count=len(df),
                raw_columns=list(df.columns),
                file_size_bytes=file_size
            )
            return df, summary

        bucket_name, blob_path = self._parse_gcs_uri(uri)

        for attempt in range(1, self.config.max_retries + 1):
            try:
                bucket = self.client.bucket(bucket_name)
                blob = bucket.blob(blob_path)

                if not blob.exists():
                    raise FileNotFoundError(f"Blob does not exist: {uri}")

                blob.reload()
                size_bytes = blob.size or 0
                if size_bytes == 0:
                    raise ValueError(f"Source file is empty (0 bytes): {uri}")

                raw_bytes = blob.download_as_bytes()
                df = pd.read_csv(io.BytesIO(raw_bytes))

                if df.empty:
                    raise ValueError(f"Parsed DataFrame is empty from source: {uri}")

                summary = ExtractionSummary(
                    source_uri=uri,
                    raw_row_count=len(df),
                    raw_columns=list(df.columns),
                    file_size_bytes=size_bytes
                )
                logger.info(
                    "Extraction successful: %d rows, %d columns, %d bytes",
                    summary.raw_row_count,
                    len(summary.raw_columns),
                    summary.file_size_bytes
                )
                return df, summary

            except Exception as exc:
                logger.warning(
                    "Extraction attempt %d/%d failed: %s",
                    attempt,
                    self.config.max_retries,
                    str(exc)
                )
                if attempt == self.config.max_retries:
                    raise RuntimeError(
                        f"Failed to extract {uri} after {self.config.max_retries} attempts: {exc}"
                    ) from exc
                sleep_time = self.config.retry_delay_seconds * (2 ** (attempt - 1))
                time.sleep(sleep_time)

        raise RuntimeError(f"Failed to extract {uri} after {self.config.max_retries} attempts.")
