"""Unit and integration tests for Cloud Run Job ETL Pipeline (SCRUM-390)."""
import pytest
from unittest.mock import patch, MagicMock

pd = pytest.importorskip("pandas")
np = pytest.importorskip("numpy")

from server.etl.config import ETLConfig
from server.etl.transform import transform_and_deduplicate
from server.etl.ingest import extract_sales_data_from_gcs
from server.etl.loader import load_to_bigquery
from server.main import run_etl


@pytest.fixture
def sample_raw_df():
    """Provides sample raw sales order DataFrame with duplicates and dirty values."""
    return pd.DataFrame({
        "order_id": ["1001", "1002", "1001", "1003", "invalid_id"],
        "customer_id": [" CUST-201 ", "CUST-202", "CUST-201", "CUST-203", "CUST-999"],
        "customer_name": ["Alice Johnson", "Bob Smith", "Alice J.", "Carlos Rivera", ""],
        "customer_email": ["alice@example.com", "bob@example.com", "alice_updated@example.com", None, ""],
        "product_category": ["Electronics", "Books", "Electronics", "Beauty", None],
        "amount": ["$299.99", "49.50", "$310.00", "15.20", "invalid_amt"],
        "currency": ["USD", "USD", "USD", "USD", "USD"],
        "order_status": ["COMPLETED", "PENDING", "COMPLETED", "CANCELLED", "UNKNOWN"],
        "created_at": [
            "2026-09-01T10:14:22Z",
            "2026-09-01T11:05:10Z",
            "2026-09-01T12:00:00Z",
            "2026-09-01T11:45:00Z",
            "not-a-date",
        ]
    })


def test_etl_config():
    """Verifies default ETL configuration."""
    config = ETLConfig()
    assert config.gcs_bucket_name == "sdlc-workspec-store"
    assert config.gcs_source_blob == "etl/data/raw_sales_data.csv"
    assert config.bq_dataset_id == "analytics"
    assert config.bq_table_id == "harshada-test4"
    assert "analytics.harshada-test4" in config.target_table_ref


def test_transform_and_deduplicate(sample_raw_df):
    """Verifies data cleaning, type coercion, and order_id deduplication."""
    df_clean, metrics = transform_and_deduplicate(sample_raw_df)

    assert metrics["records_extracted"] == 5
    assert metrics["records_quarantined"] == 1
    assert metrics["duplicates_dropped"] == 1
    assert metrics["records_cleaned"] == 3
    assert len(df_clean) == 3

    row_1001 = df_clean[df_clean["order_id"] == 1001].iloc[0]
    assert row_1001["customer_name"] == "Alice J."
    assert row_1001["amount"] == 310.0
    assert row_1001["customer_email"] == "alice_updated@example.com"

    row_1002 = df_clean[df_clean["order_id"] == 1002].iloc[0]
    assert row_1002["customer_id"] == "CUST-202"

    row_1003 = df_clean[df_clean["order_id"] == 1003].iloc[0]
    assert pd.isna(row_1003["customer_email"]) or row_1003["customer_email"] is None

    assert "ingested_at" in df_clean.columns


def test_transform_circuit_breaker():
    """Verifies that circuit breaker raises ValueError if 100% of rows are invalid."""
    all_invalid_df = pd.DataFrame({
        "order_id": ["bad_1", "bad_2"],
        "amount": ["nan", "none"]
    })
    with pytest.raises(ValueError, match="Circuit breaker triggered"):
        transform_and_deduplicate(all_invalid_df)


def test_transform_empty_dataframe():
    """Verifies handling of empty input dataframe."""
    df_empty, metrics = transform_and_deduplicate(pd.DataFrame())
    assert df_empty.empty
    assert metrics["records_extracted"] == 0
    assert metrics["records_cleaned"] == 0


@patch("server.etl.ingest.storage.Client")
def test_extract_sales_data_from_gcs_success(mock_storage_client):
    """Verifies successful CSV extraction from GCS."""
    csv_bytes = b"order_id,customer_id,customer_name,amount,created_at\n101,C1,Alice,10.5,2026-09-01T00:00:00Z\n"
    mock_blob = MagicMock()
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = csv_bytes

    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob

    mock_client_instance = MagicMock()
    mock_client_instance.bucket.return_value = mock_bucket
    mock_storage_client.return_value = mock_client_instance

    df = extract_sales_data_from_gcs("test-bucket", "test.csv")
    assert len(df) == 1
    assert "order_id" in df.columns
    assert df.iloc[0]["order_id"] == 101


@patch("server.etl.ingest.storage.Client")
def test_extract_sales_data_missing_file_raises(mock_storage_client):
    """Verifies fail-fast behavior when GCS blob is missing."""
    mock_blob = MagicMock()
    mock_blob.exists.return_value = False

    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob

    mock_client_instance = MagicMock()
    mock_client_instance.bucket.return_value = mock_bucket
    mock_storage_client.return_value = mock_client_instance

    with pytest.raises(FileNotFoundError):
        extract_sales_data_from_gcs("test-bucket", "missing.csv")


@patch("server.etl.loader.bigquery.Client")
def test_load_to_bigquery_success(mock_bq_client):
    """Verifies successful loading of transformed DataFrame into BigQuery."""
    mock_client_instance = MagicMock()
    mock_job = MagicMock()
    mock_job.result.return_value = None
    mock_client_instance.load_table_from_dataframe.return_value = mock_job
    mock_bq_client.return_value = mock_client_instance

    df = pd.DataFrame({
        "order_id": pd.Series([1001], dtype="Int64"),
        "customer_id": ["CUST-1"],
        "amount": [150.0],
    })

    loaded_count = load_to_bigquery(
        df=df,
        project_id="test-project",
        dataset_id="analytics",
        table_id="harshada-test4",
        write_mode="append",
    )
    assert loaded_count == 1
    mock_client_instance.load_table_from_dataframe.assert_called_once()


@patch("server.main.extract_sales_data_from_gcs")
@patch("server.main.load_to_bigquery")
def test_main_run_etl_success(mock_load, mock_extract, sample_raw_df):
    """Verifies end-to-end execution flow via run_etl entrypoint."""
    mock_extract.return_value = sample_raw_df
    mock_load.return_value = 3

    exit_code = run_etl()
    assert exit_code == 0
