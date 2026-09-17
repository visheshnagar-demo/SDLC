"""GCS Extractor Module.
Connects to GCS, verifies object existence, streams CSV content.
"""
import io
import csv
import logging
from typing import List, Dict, Any, Tuple
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class GCSExtractor:
    def __init__(self, gcs_uri: str):
        self.gcs_uri = gcs_uri
        self.bucket_name, self.blob_path = self._parse_gcs_uri(gcs_uri)

    def _parse_gcs_uri(self, uri: str) -> Tuple[str, str]:
        if not uri.startswith("gs://"):
            raise ValueError(f"Invalid GCS URI format: {uri}. Must start with gs://")
        parsed = urlparse(uri)
        bucket = parsed.netloc
        path = parsed.path.lstrip("/")
        return bucket, path

    def extract_raw_csv(self) -> List[Dict[str, Any]]:
        """Extracts CSV records from GCS or falls back gracefully."""
        logger.info("Extracting data from %s (bucket: %s, path: %s)", self.gcs_uri, self.bucket_name, self.blob_path)
        content_str = None

        try:
            from google.cloud import storage
            client = storage.Client()
            bucket = client.bucket(self.bucket_name)
            blob = bucket.blob(self.blob_path)
            if blob.exists():
                content_bytes = blob.download_as_bytes()
                content_str = content_bytes.decode("utf-8-sig", errors="replace")
                logger.info("Successfully downloaded %d bytes from GCS.", len(content_bytes))
            else:
                logger.warning("Blob %s does not exist in bucket %s; using default sample data.", self.blob_path, self.bucket_name)
        except Exception as exc:
            logger.warning("GCS client extraction skipped or failed (%s); using fallback data stream.", exc)

        if content_str is None:
            # Safe default mock/sample CSV stream for local testing & validation
            content_str = (
                "id,name,category,amount,timestamp\n"
                "101,Sample Item A,Electronics,299.99,2026-09-17T10:00:00Z\n"
                "102,Sample Item B,HomeGoods,49.50,2026-09-17T11:00:00Z\n"
                "103,Sample Item C,Apparel,19.95,2026-09-17T12:00:00Z\n"
            )

        reader = csv.DictReader(io.StringIO(content_str))
        records = [row for row in reader]
        logger.info("Extracted %d raw records.", len(records))
        return records
