"""Unit tests for the GCSReader module."""
from unittest.mock import MagicMock
import pytest

pd = pytest.importorskip("pandas")

from src.ingestion.gcs_reader import GCSReader


def test_parse_gcs_uri_valid():
    """Verifies valid GCS URI parsing."""
    reader = GCSReader(client=MagicMock())
    bucket, blob = reader.parse_gcs_uri("gs://my-bucket/path/to/data.csv")
    assert bucket == "my-bucket"
    assert blob == "path/to/data.csv"


def test_parse_gcs_uri_invalid_prefix():
    """Verifies that non-gs:// URI raises ValueError."""
    reader = GCSReader(client=MagicMock())
    with pytest.raises(ValueError, match="Invalid GCS URI"):
        reader.parse_gcs_uri("s3://my-bucket/data.csv")


def test_parse_gcs_uri_missing_blob():
    """Verifies that URI without blob path raises ValueError."""
    reader = GCSReader(client=MagicMock())
    with pytest.raises(ValueError, match="Invalid GCS URI format"):
        reader.parse_gcs_uri("gs://my-bucket")


def test_read_csv_missing_parameters():
    """Verifies ValueError when neither gcs_uri nor bucket/blob names are provided."""
    reader = GCSReader(client=MagicMock())
    with pytest.raises(ValueError, match="Either gcs_uri or both bucket_name and blob_name"):
        reader.read_csv()


def test_read_csv_blob_not_found():
    """Verifies FileNotFoundError when blob does not exist."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_blob.exists.return_value = False
    mock_bucket.blob.return_value = mock_blob
    mock_client.bucket.return_value = mock_bucket

    reader = GCSReader(client=mock_client)
    with pytest.raises(FileNotFoundError, match="does not exist"):
        reader.read_csv(gcs_uri="gs://test-bucket/nonexistent.csv")


def test_read_csv_empty_blob():
    """Verifies ValueError when blob bytes are empty."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = b""
    mock_bucket.blob.return_value = mock_blob
    mock_client.bucket.return_value = mock_bucket

    reader = GCSReader(client=mock_client)
    with pytest.raises(ValueError, match="is empty"):
        reader.read_csv(bucket_name="test-bucket", blob_name="empty.csv")


def test_read_csv_success():
    """Verifies successful download and DataFrame parsing from GCS."""
    csv_bytes = b"order_id,customer_id,amount\n101,C1,99.99\n102,C2,149.50\n"

    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = csv_bytes
    mock_bucket.blob.return_value = mock_blob
    mock_client.bucket.return_value = mock_bucket

    reader = GCSReader(client=mock_client)
    df = reader.read_csv(gcs_uri="gs://test-bucket/sales.csv")

    assert len(df) == 2
    assert list(df.columns) == ["order_id", "customer_id", "amount"]
    assert df["order_id"].tolist() == [101, 102]
