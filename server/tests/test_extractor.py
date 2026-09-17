"""Unit tests for GCSExtractor."""
import pytest
from unittest.mock import MagicMock
from server.etl.extractor import GCSExtractor


def test_extractor_initialization_defaults():
    extractor = GCSExtractor()
    assert extractor.bucket_name == "sdlc-workspec-store"
    assert extractor.source_blob_name == "etl/data/my_file (1).csv"
    assert extractor.source_uri == "gs://sdlc-workspec-store/etl/data/my_file (1).csv"


def test_extractor_url_decoding():
    extractor = GCSExtractor(
        bucket_name="my-bucket",
        source_blob_name="etl/data/my_file%20(1).csv",
    )
    assert extractor.source_blob_name == "etl/data/my_file (1).csv"
    assert extractor.source_uri == "gs://my-bucket/etl/data/my_file (1).csv"


def test_extractor_parse_dataframe():
    raw_csv = "id,name,amount\n1,Alice,100\n2,Bob,200\n"
    extractor = GCSExtractor()
    data = extractor.extract_dataframe(csv_content=raw_csv)
    assert len(data) == 2
    if hasattr(data, "iloc"):
        assert data.iloc[0]["name"] == "Alice"
    else:
        assert data[0]["name"] == "Alice"


def test_extractor_download_with_mock_client():
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_blob.exists.return_value = True
    mock_blob.download_as_text.return_value = "id,value\n101,test"
    mock_bucket.blob.return_value = mock_blob
    mock_client.bucket.return_value = mock_bucket

    extractor = GCSExtractor(
        bucket_name="test-bucket",
        source_blob_name="test.csv",
        storage_client=mock_client,
    )
    content = extractor.extract_csv_content()
    assert content == "id,value\n101,test"
    mock_client.bucket.assert_called_once_with("test-bucket")
    mock_blob.download_as_text.assert_called_once()
