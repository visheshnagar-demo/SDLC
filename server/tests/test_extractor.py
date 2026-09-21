"""Unit tests for GCSExtractor."""
from unittest.mock import MagicMock, patch
import pytest

pd = pytest.importorskip("pandas")
from server.pipeline.config import PipelineConfig
from server.pipeline.extractor import GCSExtractor


@pytest.fixture
def test_config():
    return PipelineConfig(
        gcp_project_id="upbeat-repeater-477110-q6",
        bq_dataset="analytics",
        bq_table="test2",
        gcs_source_bucket="sdlc-workspec-store",
        gcs_source_prefix="etl/data/my_file (1).csv",
    )


@patch("server.pipeline.extractor.storage.Client")
def test_extractor_success(mock_storage_client, test_config):
    csv_bytes = b"Rank,Artist,Tour title\n1,Taylor Swift,The Eras Tour\n2,Beyonce,Renaissance\n"
    mock_blob = MagicMock()
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = csv_bytes

    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_storage_client.return_value.bucket.return_value = mock_bucket

    extractor = GCSExtractor(test_config)
    df = extractor.extract_to_dataframe()

    assert isinstance(df, pd.DataFrame)
    assert len(df) == 2
    assert "Rank" in df.columns
    assert "Artist" in df.columns


@patch("server.pipeline.extractor.storage.Client")
def test_extractor_not_found(mock_storage_client, test_config):
    mock_blob = MagicMock()
    mock_blob.exists.return_value = False

    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_bucket.list_blobs.return_value = []
    mock_storage_client.return_value.bucket.return_value = mock_bucket

    extractor = GCSExtractor(test_config)
    with pytest.raises(FileNotFoundError):
        extractor.extract_to_dataframe()
