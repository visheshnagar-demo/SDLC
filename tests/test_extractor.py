"""Unit tests for GCS data extractor."""
from unittest.mock import MagicMock, patch
import pytest

pd = pytest.importorskip("pandas")
pytest.importorskip("google.cloud.storage")

from pipeline.config import PipelineConfig
from pipeline.extractor import GCSExtractor


@pytest.fixture
def mock_config():
    return PipelineConfig(
        gcp_project_id="test-project",
        bigquery_dataset="analytics",
        bigquery_table="vishesh-test1",
        gcs_source_bucket="test-bucket",
        gcs_source_prefix="etl/data/raw_sales_data.csv",
        staging_dir="staging/test",
        write_disposition="WRITE_TRUNCATE",
    )


def test_extractor_missing_file_raises_error(mock_config):
    """Test that extractor fails fast when source blob does not exist (zero-mock policy)."""
    with patch("pipeline.extractor.storage.Client") as mock_client:
        instance = mock_client.return_value
        bucket = instance.bucket.return_value
        blob = bucket.blob.return_value
        blob.exists.return_value = False
        bucket.list_blobs.return_value = []

        extractor = GCSExtractor(mock_config)
        with pytest.raises(FileNotFoundError, match="FATAL: Source object.*does not exist"):
            extractor.extract_to_dataframe()


def test_extractor_success(mock_config):
    """Test successful extraction of CSV bytes to DataFrame."""
    sample_csv = b"order_id,customer_id,customer_name,currency,order_status,created_at\n1001,C-1,Alice,USD,COMPLETED,2026-09-01T10:00:00Z\n"

    with patch("pipeline.extractor.storage.Client") as mock_client:
        instance = mock_client.return_value
        bucket = instance.bucket.return_value
        blob = bucket.blob.return_value
        blob.exists.return_value = True
        blob.download_as_bytes.return_value = sample_csv

        extractor = GCSExtractor(mock_config)
        df = extractor.extract_to_dataframe()

        assert len(df) == 1
        assert df["order_id"].iloc[0] == 1001
        assert df["customer_id"].iloc[0] == "C-1"
