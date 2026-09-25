"""Unit tests for GCSSourceExtractor."""
import io
import pytest
from unittest.mock import MagicMock
from server.compat import pd
from server.config import PipelineConfig
from server.extractor import GCSSourceExtractor


def test_parse_gcs_uri():
    """Test parsing of valid and invalid GCS URIs."""
    config = PipelineConfig(source_gcs_uri="gs://my-bucket/path/to/data.csv")
    extractor = GCSSourceExtractor(config)

    bucket, blob = extractor._parse_gcs_uri("gs://my-bucket/path/to/data.csv")
    assert bucket == "my-bucket"
    assert blob == "path/to/data.csv"

    with pytest.raises(ValueError):
        extractor._parse_gcs_uri("https://storage.googleapis.com/bucket/file.csv")

    with pytest.raises(ValueError):
        extractor._parse_gcs_uri("gs://")


def test_extract_from_local_file(tmp_path):
    """Test extractor reading directly from a local CSV path."""
    csv_file = tmp_path / "sample.csv"
    csv_file.write_text("Rank,Artist,Shows\n1,Taylor Swift,56\n2,Beyoncé,56\n", encoding="utf-8")

    config = PipelineConfig(source_gcs_uri=str(csv_file))
    extractor = GCSSourceExtractor(config)
    df, summary = extractor.extract()

    assert len(df) == 2
    assert summary.raw_row_count == 2
    assert "Rank" in df.columns
    assert "Artist" in df.columns


def test_extract_from_gcs_mocked():
    """Test extractor downloading from mocked GCS client."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob

    mock_blob.exists.return_value = True
    mock_blob.size = 256
    csv_content = b"Rank,Artist,Shows\n1,Taylor Swift,56\n2,Beyonce,56\n"
    mock_blob.download_as_bytes.return_value = csv_content

    config = PipelineConfig(source_gcs_uri="gs://mock-bucket/etl/data.csv")
    extractor = GCSSourceExtractor(config, storage_client=mock_client)
    df, summary = extractor.extract()

    assert len(df) == 2
    assert summary.raw_row_count == 2
    assert summary.file_size_bytes == 256


def test_extract_gcs_blob_not_found():
    """Test fail-fast circuit breaker when blob does not exist."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = False

    config = PipelineConfig(
        source_gcs_uri="gs://mock-bucket/etl/missing.csv",
        max_retries=1,
        retry_delay_seconds=0.01
    )
    extractor = GCSSourceExtractor(config, storage_client=mock_client)

    with pytest.raises(RuntimeError) as exc_info:
        extractor.extract()
    assert "Blob does not exist" in str(exc_info.value)
