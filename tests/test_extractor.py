"""Unit tests for GCSExtractor module."""
from unittest.mock import patch, MagicMock
import pytest
pd = pytest.importorskip("pandas")
from pipeline.extractor import GCSExtractor


def test_extractor_missing_bucket():
    with patch.dict("os.environ", {"GCS_SOURCE_BUCKET": ""}):
        with pytest.raises(EnvironmentError, match="FATAL: GCS source bucket not configured"):
            GCSExtractor(bucket_name="")


@patch("google.cloud.storage.Client")
def test_extractor_file_not_found(mock_storage_client):
    mock_client_inst = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_blob.exists.return_value = False
    mock_bucket.blob.return_value = mock_blob
    mock_bucket.list_blobs.return_value = []
    mock_client_inst.bucket.return_value = mock_bucket
    mock_storage_client.return_value = mock_client_inst

    extractor = GCSExtractor(bucket_name="sdlc-workspec-store", prefix="missing_file.csv")
    with pytest.raises(FileNotFoundError, match="FATAL: No data files found in gs://"):
        extractor.extract_to_dataframe()


@patch("google.cloud.storage.Client")
def test_extractor_success(mock_storage_client):
    mock_client_inst = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_blob.exists.return_value = True
    mock_blob.name = "my_file (1).csv"
    mock_blob.size = 128
    mock_blob.download_as_bytes.return_value = b"Rank,Artist\n1,Taylor Swift\n"
    mock_bucket.blob.return_value = mock_blob
    mock_client_inst.bucket.return_value = mock_bucket
    mock_storage_client.return_value = mock_client_inst

    extractor = GCSExtractor(bucket_name="sdlc-workspec-store", prefix="etl/data/my_file (1).csv")
    df = extractor.extract_to_dataframe()
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 1
    assert "Rank" in df.columns
