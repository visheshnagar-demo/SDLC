"""GCS Extractor module for downloading and streaming CSV files."""
import io
import os
import csv
import urllib.parse
import logging
from typing import Optional, Any

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger(__name__)


class GCSExtractor:
    """Extracts CSV files from Google Cloud Storage."""

    def __init__(
        self,
        bucket_name: Optional[str] = None,
        source_blob_name: Optional[str] = None,
        storage_client=None,
    ):
        self.bucket_name = (
            bucket_name
            or os.getenv("GCS_BUCKET_NAME")
            or "sdlc-workspec-store"
        )
        raw_blob = (
            source_blob_name
            or os.getenv("GCS_SOURCE_BLOB")
            or "etl/data/my_file (1).csv"
        )
        # Decode any URL encoded characters (e.g. %20 -> space)
        self.source_blob_name = urllib.parse.unquote(raw_blob)
        self._client = storage_client

    def _get_client(self):
        if self._client is not None:
            return self._client
        try:
            from google.cloud import storage

            project_id = os.getenv("GCP_PROJECT_ID") or "upbeat-repeater-477110-q6"
            self._client = storage.Client(project=project_id)
            return self._client
        except Exception as exc:
            logger.warning("Could not initialize Google Cloud Storage client: %s", exc)
            return None

    def extract_csv_content(self) -> str:
        """Download raw CSV text content from GCS."""
        client = self._get_client()
        if client is None:
            raise RuntimeError(
                f"GCS client unavailable to download gs://{self.bucket_name}/{self.source_blob_name}"
            )
        bucket = client.bucket(self.bucket_name)
        blob = bucket.blob(self.source_blob_name)
        if not blob.exists():
            raise FileNotFoundError(
                f"Source blob not found: gs://{self.bucket_name}/{self.source_blob_name}"
            )
        return blob.download_as_text(encoding="utf-8")

    def extract_dataframe(self, csv_content: Optional[str] = None) -> Any:
        """Parse raw CSV text into a DataFrame or list of dicts."""
        if csv_content is None:
            csv_content = self.extract_csv_content()
        if pd is not None:
            return pd.read_csv(io.StringIO(csv_content), dtype=str, keep_default_na=False)
        else:
            reader = csv.DictReader(io.StringIO(csv_content))
            return list(reader)

    @property
    def source_uri(self) -> str:
        return f"gs://{self.bucket_name}/{self.source_blob_name}"
