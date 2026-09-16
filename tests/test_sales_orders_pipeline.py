"""Unit and integration tests for Sales Orders ETL Pipeline."""
import io
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
import pandas as pd
import pytest
from google.cloud.exceptions import NotFound

from server.pipeline.extractor import GCSFileReader
from server.pipeline.transformer import SalesDataTransformer, REQUIRED_COLUMNS
from server.pipeline.loader import BigQueryLoader, BQ_SCHEMA
from server.main import ETLRunner


# ---------------------------------------------------------------------------
# 1. Extractor Tests
# ---------------------------------------------------------------------------

def test_parse_gcs_uri_valid():
    """Test valid GCS URI parsing."""
    bucket, blob = GCSFileReader.parse_gcs_uri("gs://my-bucket/path/to/data.csv")
    assert bucket == "my-bucket"
    assert blob == "path/to/data.csv"


def test_parse_gcs_uri_invalid():
    """Test invalid GCS URI raises ValueError."""
    with pytest.raises(ValueError, match="Invalid GCS URI format"):
        GCSFileReader.parse_gcs_uri("https://storage.googleapis.com/bucket/file.csv")


def test_extract_from_csv_data():
    """Test extracting from string CSV data."""
    extractor = GCSFileReader()
    csv_str = "order_id,customer_id,amount,currency,order_status,created_at\nORD-1,CUST-1,100.5,USD,COMPLETED,2026-05-01T10:00:00Z"
    df = extractor.extract_from_csv_data(csv_str)
    assert len(df) == 1
    assert df["order_id"].iloc[0] == "ORD-1"


def test_extract_from_gcs_success():
    """Test successful GCS extraction with mock storage client."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = b"order_id,customer_id,amount,currency,order_status,created_at\nORD-1,CUST-1,50.0,USD,COMPLETED,2026-05-01T12:00:00Z"

    extractor = GCSFileReader(client=mock_client)
    df = extractor.extract_from_gcs("gs://test-bucket/etl/raw_sales.csv")

    assert len(df) == 1
    assert df["order_id"].iloc[0] == "ORD-1"
    mock_client.bucket.assert_called_once_with("test-bucket")
    mock_bucket.blob.assert_called_once_with("etl/raw_sales.csv")


def test_extract_from_gcs_file_not_found():
    """Test GCS extraction raises FileNotFoundError when blob does not exist."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = False

    extractor = GCSFileReader(client=mock_client)
    with pytest.raises(FileNotFoundError, match="CRITICAL: Source file not found"):
        extractor.extract_from_gcs("gs://test-bucket/missing.csv")


def test_extract_from_gcs_empty_file():
    """Test GCS extraction returns empty DataFrame when file has no content."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = b""

    extractor = GCSFileReader(client=mock_client)
    df = extractor.extract_from_gcs("gs://test-bucket/empty.csv")
    assert df.empty


# ---------------------------------------------------------------------------
# 2. Transformer & Deduplication Tests
# ---------------------------------------------------------------------------

def test_transform_missing_mandatory_columns():
    """Test transformer raises ValueError when mandatory columns are absent."""
    transformer = SalesDataTransformer()
    invalid_df = pd.DataFrame([{"order_id": "ORD-1", "customer_id": "CUST-1"}])
    with pytest.raises(ValueError, match="Missing mandatory column"):
        transformer.transform(invalid_df)


def test_transform_cleansing_and_filtering():
    """Test data cleaning, trimming, and invalid row filtering."""
    transformer = SalesDataTransformer()
    raw_data = [
        # Valid row with trailing spaces
        {
            " order_id ": "  ORD-101  ",
            " customer_id ": "  CUST-201 ",
            " customer_name": " John Doe ",
            "customer_email": "john@example.com",
            "product_category": "Electronics",
            "amount": " 150.75 ",
            "currency": " usd ",
            "order_status": " completed ",
            "created_at": "2026-05-10 14:30:00",
        },
        # Invalid row: negative amount
        {
            "order_id": "ORD-102",
            "customer_id": "CUST-202",
            "amount": "-50.0",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-05-10 15:00:00",
        },
        # Invalid row: missing order_id
        {
            "order_id": None,
            "customer_id": "CUST-203",
            "amount": "80.0",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-05-10 15:00:00",
        },
        # Invalid row: unparseable date
        {
            "order_id": "ORD-104",
            "customer_id": "CUST-204",
            "amount": "99.0",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "not-a-valid-date",
        },
    ]
    df_raw = pd.DataFrame(raw_data)
    df_clean, metrics = transformer.transform(df_raw)

    assert len(df_clean) == 1
    assert metrics["records_extracted"] == 4
    assert metrics["records_cleaned"] == 1
    assert metrics["records_dropped"] == 3

    row = df_clean.iloc[0]
    assert row["order_id"] == "ORD-101"
    assert row["customer_id"] == "CUST-201"
    assert row["customer_name"] == "John Doe"
    assert row["amount"] == 150.75
    assert row["currency"] == "USD"
    assert row["order_status"] == "COMPLETED"
    assert pd.notnull(row["ingested_at"])


def test_transform_deduplication_keeps_latest():
    """Test deduplication logic preserves the latest record by created_at."""
    transformer = SalesDataTransformer()
    raw_data = [
        # Older state of ORD-001
        {
            "order_id": "ORD-001",
            "customer_id": "CUST-1",
            "amount": "100.0",
            "currency": "USD",
            "order_status": "PENDING",
            "created_at": "2026-05-01T10:00:00Z",
        },
        # Newer state of ORD-001 (should be preserved)
        {
            "order_id": "ORD-001",
            "customer_id": "CUST-1",
            "amount": "120.0",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-05-01T12:00:00Z",
        },
        # Another order
        {
            "order_id": "ORD-002",
            "customer_id": "CUST-2",
            "amount": "200.0",
            "currency": "EUR",
            "order_status": "COMPLETED",
            "created_at": "2026-05-01T11:00:00Z",
        },
    ]
    df_raw = pd.DataFrame(raw_data)
    df_clean, metrics = transformer.transform(df_raw)

    assert len(df_clean) == 2
    assert metrics["records_extracted"] == 3
    assert metrics["records_cleaned"] == 3
    assert metrics["records_deduplicated"] == 2
    assert metrics["records_dropped"] == 1

    ord1 = df_clean[df_clean["order_id"] == "ORD-001"].iloc[0]
    assert ord1["order_status"] == "COMPLETED"
    assert ord1["amount"] == 120.0


def test_transform_empty_dataframe():
    """Test transformer with empty input."""
    transformer = SalesDataTransformer()
    df_clean, metrics = transformer.transform(pd.DataFrame())
    assert df_clean.empty
    assert metrics["records_extracted"] == 0
    assert metrics["records_deduplicated"] == 0


# ---------------------------------------------------------------------------
# 3. BigQuery Loader Tests
# ---------------------------------------------------------------------------

def test_loader_ensure_dataset_and_table_exist():
    """Test dataset and table creation with partitioning and clustering."""
    mock_client = MagicMock()
    mock_client.get_dataset.side_effect = NotFound("Dataset not found")
    mock_client.get_table.side_effect = NotFound("Table not found")

    loader = BigQueryLoader(
        project_id="test-proj",
        dataset_id="analytics",
        table_id="sales_orders",
        client=mock_client,
    )

    loader.ensure_table_exists()

    assert mock_client.create_dataset.call_count == 1
    assert mock_client.create_table.call_count == 1
    
    # Inspect table configuration created
    created_table = mock_client.create_table.call_args[0][0]
    assert created_table.time_partitioning.field == "created_at"
    assert created_table.clustering_fields == ["customer_id", "order_status"]


def test_loader_load_dataframe_success():
    """Test successful loading of DataFrame into BigQuery."""
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = None
    mock_job.output_rows = 5
    mock_job.job_id = "job-12345"
    mock_client.load_table_from_dataframe.return_value = mock_job

    loader = BigQueryLoader(
        project_id="test-proj",
        dataset_id="analytics",
        table_id="sales_orders",
        client=mock_client,
    )

    sample_df = pd.DataFrame([
        {
            "order_id": f"ORD-{i}",
            "customer_id": f"CUST-{i}",
            "customer_name": f"Cust {i}",
            "customer_email": f"cust{i}@test.com",
            "product_category": "General",
            "amount": 10.0 * i,
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": pd.Timestamp("2026-05-01T10:00:00Z"),
            "ingested_at": pd.Timestamp("2026-05-01T10:05:00Z"),
        }
        for i in range(1, 6)
    ])

    loaded_count = loader.load_dataframe(sample_df)

    assert loaded_count == 5
    mock_client.load_table_from_dataframe.assert_called_once()


def test_loader_load_dataframe_with_error():
    """Test BigQuery loader error handling when load job fails."""
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = [{"message": "Invalid schema mapping"}]
    mock_client.load_table_from_dataframe.return_value = mock_job

    loader = BigQueryLoader(
        project_id="test-proj",
        dataset_id="analytics",
        table_id="sales_orders",
        client=mock_client,
    )

    sample_df = pd.DataFrame([{"order_id": "ORD-1"}])

    with pytest.raises(RuntimeError, match="BigQuery load job encountered errors"):
        loader.load_dataframe(sample_df)


# ---------------------------------------------------------------------------
# 4. End-to-End ETL Runner Tests
# ---------------------------------------------------------------------------

@patch("server.main.GCSFileReader")
@patch("server.main.BigQueryLoader")
def test_etl_runner_end_to_end(mock_loader_cls, mock_extractor_cls):
    """Test full ETLRunner lifecycle execution."""
    mock_extractor = MagicMock()
    mock_loader = MagicMock()
    mock_extractor_cls.return_value = mock_extractor
    mock_loader_cls.return_value = mock_loader

    # Sample raw extracted CSV DataFrame
    raw_df = pd.DataFrame([
        {
            "order_id": "ORD-001",
            "customer_id": "CUST-1",
            "customer_name": "Alice",
            "customer_email": "alice@example.com",
            "product_category": "Books",
            "amount": "25.50",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-05-15T08:00:00Z",
        },
        {
            "order_id": "ORD-001",  # Duplicate to test deduplication
            "customer_id": "CUST-1",
            "customer_name": "Alice",
            "customer_email": "alice@example.com",
            "product_category": "Books",
            "amount": "25.50",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-05-15T09:00:00Z",
        },
        {
            "order_id": "ORD-002",
            "customer_id": "CUST-2",
            "customer_name": "Bob",
            "customer_email": "bob@example.com",
            "product_category": "Electronics",
            "amount": "199.99",
            "currency": "USD",
            "order_status": "PENDING",
            "created_at": "2026-05-15T09:30:00Z",
        },
    ])
    mock_extractor.extract_from_gcs.return_value = raw_df
    mock_loader.load_dataframe.return_value = 2

    runner = ETLRunner(
        source_uri="gs://sdlc-workspec-store/etl/data/raw_sales_data.csv",
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="sales_orders",
    )
    result = runner.run()

    assert result["status"] == "SUCCESS"
    assert result["records_extracted"] == 3
    assert result["records_cleaned"] == 3
    assert result["records_deduplicated"] == 2
    assert result["records_dropped"] == 1
    assert result["records_loaded"] == 2
    assert result["duration_ms"] >= 0
