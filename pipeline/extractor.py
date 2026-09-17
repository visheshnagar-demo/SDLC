import io, os, logging, pandas as pd
from google.cloud import storage

logger = logging.getLogger(__name__)

class SalesDataExtractor:
    def __init__(self, bucket=None, blob=None):
        self.bucket = bucket or os.getenv("GCS_SOURCE_BUCKET", "sdlc-workspec-store")
        self.blob = blob or os.getenv("GCS_SOURCE_PREFIX", "etl/data/raw_sales_data.csv")

    def extract(self) -> pd.DataFrame:
        client = storage.Client()
        b = client.bucket(self.bucket).blob(self.blob)
        if not b.exists():
            logger.warning("GCS file gs://%s/%s not found", self.bucket, self.blob)
            return pd.DataFrame()
        data = b.download_as_bytes()
        if not data or not data.strip():
            return pd.DataFrame()
        return pd.read_csv(io.BytesIO(data), dtype=str)

def extract_sales_data(bucket=None, blob=None) -> pd.DataFrame:
    return SalesDataExtractor(bucket, blob).extract()
