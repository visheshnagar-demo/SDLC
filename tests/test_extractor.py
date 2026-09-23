"""Unit tests for GCS Extractor."""
import ast
import os
import pytest
from unittest.mock import MagicMock, patch

try:
    import pandas as pd
except ImportError:
    pd = None

from server.extractor import GCSExtractor, extract_from_gcs


def test_extractor_file_syntax():
    file_path = os.path.join("server", "extractor.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None


def test_extractor_missing_config():
    extractor = GCSExtractor(bucket_name="", prefix="")
    with pytest.raises(EnvironmentError):
        extractor.extract()


def test_extractor_single_csv_success():
    if pd is None:
        pytest.skip("pandas not installed")

    csv_data = (
        "order_id,customer_id,customer_name,customer_email,product_category,amount,currency,order_status,created_at\n"
        "1001,CUST-201,Alice Johnson,alice@example.com,Electronics,299.99,USD,COMPLETED,2026-09-01T10:14:22Z\n"
    ).encode("utf-8")

    with patch("server.extractor.storage.Client") as mock_storage_client:
        mock_client = MagicMock()
        mock_bucket = MagicMock()
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        mock_blob.download_as_bytes.return_value = csv_data
        mock_bucket.blob.return_value = mock_blob
        mock_client.bucket.return_value = mock_bucket
        mock_storage_client.return_value = mock_client

        extractor = GCSExtractor(bucket_name="test-bucket", prefix="sales.csv")
        df = extractor.extract()

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 1
        assert int(df.iloc[0]["order_id"]) == 1001
        assert df.iloc[0]["customer_id"] == "CUST-201"


def test_extractor_empty_file_raises_value_error():
    if pd is None:
        pytest.skip("pandas not installed")

    with patch("server.extractor.storage.Client") as mock_storage_client:
        mock_client = MagicMock()
        mock_bucket = MagicMock()
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        mock_blob.download_as_bytes.return_value = b""
        mock_bucket.blob.return_value = mock_blob
        mock_client.bucket.return_value = mock_bucket
        mock_storage_client.return_value = mock_client

        extractor = GCSExtractor(bucket_name="test-bucket", prefix="empty.csv")
        with pytest.raises(ValueError, match="is empty"):
            extractor.extract()


def test_extractor_uri_parsing():
    extractor = GCSExtractor(gcs_uri="gs://custom-bucket/path/to/file.csv")
    assert extractor.bucket_name == "custom-bucket"
    assert extractor.prefix == "path/to/file.csv"
    assert extractor.source_uri == "gs://custom-bucket/path/to/file.csv"
