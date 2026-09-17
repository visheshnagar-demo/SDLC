"""Unit tests for GCS Extractor."""

from unittest.mock import MagicMock
import pytest
from server.extractor import GCSExtractor, parse_gcs_uri


def test_parse_gcs_uri_valid():
    bucket, blob = parse_gcs_uri("gs://my-bucket/path/to/data.csv")
    assert bucket == "my-bucket"
    assert blob == "path/to/data.csv"


def test_parse_gcs_uri_invalid_scheme():
    with pytest.raises(ValueError, match="Invalid GCS URI scheme"):
        parse_gcs_uri("https://storage.googleapis.com/my-bucket/data.csv")


def test_parse_gcs_uri_missing_blob():
    with pytest.raises(ValueError, match="Invalid GCS URI structure"):
        parse_gcs_uri("gs://my-bucket/")


def test_extract_csv_success():
    mock_storage_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_blob.exists.return_value = True
    csv_content = b"order_id,customer_id,product_id,product_category,quantity,unit_price,total_amount,order_status,created_at\nORD-1,CUST-1,PROD-1,Electronics,2,10.50,21.00,COMPLETED,2026-05-18T10:00:00Z\n"
    mock_blob.download_as_bytes.return_value = csv_content

    mock_bucket.blob.return_value = mock_blob
    mock_storage_client.bucket.return_value = mock_bucket

    extractor = GCSExtractor(storage_client=mock_storage_client)
    records = extractor.extract_csv("gs://test-bucket/sales.csv")

    assert len(records) == 1
    assert records[0]["order_id"] == "ORD-1"
    assert records[0]["customer_id"] == "CUST-1"
    assert records[0]["quantity"] == "2"


def test_extract_csv_file_not_found():
    mock_storage_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_blob.exists.return_value = False
    mock_bucket.blob.return_value = mock_blob
    mock_storage_client.bucket.return_value = mock_bucket

    extractor = GCSExtractor(storage_client=mock_storage_client)
    with pytest.raises(FileNotFoundError):
        extractor.extract_csv("gs://test-bucket/missing.csv")


def test_extract_csv_empty_file():
    mock_storage_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = b""
    mock_bucket.blob.return_value = mock_blob
    mock_storage_client.bucket.return_value = mock_bucket

    extractor = GCSExtractor(storage_client=mock_storage_client)
    records = extractor.extract_csv("gs://test-bucket/empty.csv")
    assert records == []
