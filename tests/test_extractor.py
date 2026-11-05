import io
import pytest
import pandas as pd
from unittest.mock import MagicMock, patch
from google.cloud.exceptions import NotFound

from server.extractor import parse_gcs_uri, extract_from_gcs, extract_from_local_or_buffer


def test_parse_gcs_uri_valid():
    bucket, blob = parse_gcs_uri("gs://sdlc-workspec-store/etl/data/raw_sales_data.csv")
    assert bucket == "sdlc-workspec-store"
    assert blob == "etl/data/raw_sales_data.csv"


def test_parse_gcs_uri_invalid():
    with pytest.raises(ValueError, match="Invalid GCS URI"):
        parse_gcs_uri("http://example.com/file.csv")

    with pytest.raises(ValueError, match="Invalid GCS URI"):
        parse_gcs_uri("gs://")

    with pytest.raises(ValueError, match="Invalid GCS URI"):
        parse_gcs_uri("gs://bucket-only")


def test_extract_from_gcs_success():
    csv_content = b"order_id,customer_id,product_id,quantity,unit_price,created_at\nORD-1,CUST-1,PROD-1,2,10.5,2026-05-18T10:00:00Z\n"
    
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = csv_content

    df = extract_from_gcs("gs://my-bucket/orders.csv", storage_client=mock_client)
    assert not df.empty
    assert len(df) == 1
    assert df.iloc[0]["order_id"] == "ORD-1"


def test_extract_from_gcs_missing_blob():
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = False

    df = extract_from_gcs("gs://my-bucket/missing.csv", storage_client=mock_client)
    assert df.empty


def test_extract_from_gcs_empty_content():
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = b""

    df = extract_from_gcs("gs://my-bucket/empty.csv", storage_client=mock_client)
    assert df.empty


def test_extract_from_gcs_not_found_exception():
    mock_client = MagicMock()
    mock_client.bucket.side_effect = NotFound("Bucket not found")

    df = extract_from_gcs("gs://missing-bucket/orders.csv", storage_client=mock_client)
    assert df.empty


def test_extract_from_gcs_invalid_uri():
    df = extract_from_gcs("invalid-uri", storage_client=MagicMock())
    assert df.empty


def test_extract_from_local_or_buffer():
    buf = io.StringIO("order_id,quantity\nORD-100,5\n")
    df = extract_from_local_or_buffer(buf)
    assert not df.empty
    assert len(df) == 1
    assert df.iloc[0]["order_id"] == "ORD-100"
