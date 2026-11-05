"""Unit tests for the GCS Extractor component."""

from unittest.mock import MagicMock
import pytest
from google.cloud.exceptions import NotFound
from server.extractor import Extractor, parse_gcs_uri


def test_parse_gcs_uri_valid():
    """Verify parsing of standard GCS URI."""
    uri = "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv"
    bucket, blob = parse_gcs_uri(uri)
    assert bucket == "sdlc-workspec-store"
    assert blob == "etl/data/raw_sales_data.csv"


def test_parse_gcs_uri_invalid():
    """Verify ValueError is raised on non-gs URI."""
    with pytest.raises(ValueError):
        parse_gcs_uri("http://example.com/file.csv")

    with pytest.raises(ValueError):
        parse_gcs_uri("gs://")


def test_extract_from_gcs_success():
    """AC: GCS CSV Ingestion - Successfully extract and parse CSV from GCS."""
    mock_storage_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    csv_data = b"order_id,customer_id,product_id,quantity,unit_price,total_amount,order_status,created_at\nORD-1,CUST-1,PROD-1,2,10.0,20.0,COMPLETED,2026-05-18T10:00:00Z\n"
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = csv_data
    mock_bucket.blob.return_value = mock_blob
    mock_storage_client.bucket.return_value = mock_bucket

    extractor = Extractor(storage_client=mock_storage_client)
    df = extractor.extract_from_gcs(
        "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv"
    )

    assert not df.empty
    assert len(df) == 1
    assert df.iloc[0]["order_id"] == "ORD-1"


def test_extract_from_gcs_missing_blob():
    """AC: GCS CSV Ingestion - Missing file logs warning and returns empty DataFrame."""
    mock_storage_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_blob.exists.return_value = False
    mock_bucket.blob.return_value = mock_blob
    mock_storage_client.bucket.return_value = mock_bucket

    extractor = Extractor(storage_client=mock_storage_client)
    df = extractor.extract_from_gcs("gs://sdlc-workspec-store/etl/data/missing.csv")

    assert df.empty


def test_extract_from_gcs_empty_blob():
    """AC: GCS CSV Ingestion - Empty CSV file returns empty DataFrame gracefully."""
    mock_storage_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = b""
    mock_bucket.blob.return_value = mock_blob
    mock_storage_client.bucket.return_value = mock_bucket

    extractor = Extractor(storage_client=mock_storage_client)
    df = extractor.extract_from_gcs("gs://sdlc-workspec-store/etl/data/empty.csv")

    assert df.empty


def test_extract_from_gcs_not_found_exception():
    """AC: GCS CSV Ingestion - NotFound exception handled gracefully."""
    mock_storage_client = MagicMock()
    mock_storage_client.bucket.side_effect = NotFound("Bucket not found")

    extractor = Extractor(storage_client=mock_storage_client)
    df = extractor.extract_from_gcs("gs://nonexistent-bucket/data.csv")

    assert df.empty


def test_extract_from_local_file(tmp_path):
    """Test extractor fallback with local file path."""
    csv_file = tmp_path / "local_sales.csv"
    csv_file.write_text(
        "order_id,customer_id,product_id,quantity,unit_price,created_at\n"
        "ORD-L1,CUST-L1,PROD-L1,5,15.5,2026-05-18T12:00:00Z\n"
    )

    extractor = Extractor()
    df = extractor.extract(str(csv_file))

    assert not df.empty
    assert len(df) == 1
    assert df.iloc[0]["order_id"] == "ORD-L1"
