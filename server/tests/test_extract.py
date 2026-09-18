"""Unit tests for GCS extraction module."""

from unittest.mock import MagicMock
import pytest
from server.pipeline.extract import extract_from_gcs


SAMPLE_CSV_CONTENT = (
    "Rank,Peak,All Time Peak,Actual gross,Adjusted gross (in 2022 dollars),Artist,Tour title,Year(s),Shows,Average gross,Ref.\n"
    "1,1,1,$780000000,$780000000,Taylor Swift,The Eras Tour,2023-2024,56,$13928571,[1]\n"
    "2,1,7,579800000,579800000,Beyoncé,Renaissance World Tour,2023,56,$10353571,[3]\n"
)


def test_extract_from_local_file(tmp_path):
    """Test extracting CSV directly from a local file path."""
    csv_file = tmp_path / "test_data.csv"
    csv_file.write_text(SAMPLE_CSV_CONTENT, encoding="utf-8")

    data = extract_from_gcs(str(csv_file))
    assert len(data) == 2


def test_extract_from_gcs_success():
    """Test extracting from GCS bucket with mocked storage client."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = SAMPLE_CSV_CONTENT.encode("utf-8")

    gcs_uri = "gs://sdlc-workspec-store/etl/data/my_file (1).csv"
    data = extract_from_gcs(gcs_uri, storage_client=mock_client)

    assert len(data) == 2
    mock_client.bucket.assert_called_once_with("sdlc-workspec-store")
    mock_bucket.blob.assert_called_once_with("etl/data/my_file (1).csv")


def test_extract_from_gcs_blob_not_found():
    """Test extracting from GCS when blob does not exist raises FileNotFoundError."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = False

    gcs_uri = "gs://sdlc-workspec-store/etl/data/missing_file.csv"
    with pytest.raises(FileNotFoundError):
        extract_from_gcs(gcs_uri, storage_client=mock_client)


def test_extract_from_gcs_empty_content():
    """Test extracting empty blob raises RuntimeError."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = b""

    gcs_uri = "gs://sdlc-workspec-store/etl/data/empty.csv"
    with pytest.raises(RuntimeError, match="is empty"):
        extract_from_gcs(gcs_uri, storage_client=mock_client)


def test_extract_invalid_uri():
    """Test invalid GCS URI raises ValueError."""
    with pytest.raises(ValueError):
        extract_from_gcs("gs://")
