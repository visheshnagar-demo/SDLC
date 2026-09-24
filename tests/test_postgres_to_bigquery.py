"""Unit and integration tests for PostgreSQL to BigQuery ETL pipeline."""

import os
from unittest.mock import MagicMock, patch
import pytest

try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None
    np = None

from pipeline.config import PipelineConfig


@pytest.fixture
def mock_env(monkeypatch):
    """Set up valid environment variables for tests."""
    monkeypatch.setenv("INSTANCE_CONNECTION_NAME", "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db")
    monkeypatch.setenv("POSTGRES_DB", "postgres")
    monkeypatch.setenv("POSTGRES_USER", "559906504681-compute@developer")
    monkeypatch.setenv("CLOUD_SQL_IP_TYPE", "PRIVATE")
    monkeypatch.setenv("SOURCE_TABLE", "test_data")
    monkeypatch.setenv("GCP_PROJECT", "upbeat-repeater-477110-q6")
    monkeypatch.setenv("BIGQUERY_DATASET", "analytics")
    monkeypatch.setenv("BIGQUERY_TABLE", "postgres_test2")


# 1. Config Tests
def test_config_from_env_success(mock_env):
    config = PipelineConfig.from_env()
    assert config.instance_connection_name == "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
    assert config.postgres_db == "postgres"
    assert config.postgres_user == "559906504681-compute@developer"
    assert config.cloud_sql_ip_type == "PRIVATE"
    assert config.source_table == "test_data"
    assert config.gcp_project == "upbeat-repeater-477110-q6"
    assert config.bigquery_dataset == "analytics"
    assert config.bigquery_table == "postgres_test2"


def test_config_iam_user_stripping(monkeypatch):
    monkeypatch.setenv("INSTANCE_CONNECTION_NAME", "proj:reg:inst")
    monkeypatch.setenv("POSTGRES_USER", "sa-user@my-project.gserviceaccount.com")
    monkeypatch.setenv("GCP_PROJECT", "proj")
    config = PipelineConfig.from_env()
    assert config.postgres_user == "sa-user@my-project"


def test_config_missing_required_var(monkeypatch):
    monkeypatch.delenv("INSTANCE_CONNECTION_NAME", raising=False)
    with pytest.raises(EnvironmentError):
        PipelineConfig.from_env()


# 2. Transformer Tests
@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for transformation tests")
def test_transformer_cleaning_and_null_normalization():
    from pipeline.transformer import DataTransformer
    transformer = DataTransformer()
    raw_data = {
        "id": ["1", " 2 ", "3", "4"],
        "name": [" Alice ", "Bob", "  ", "N/A"],
        "age": ["25", " 30 ", "invalid", "NULL"],
        "email": [" Alice@EXAMPLE.COM ", "bob@test.com", "none", ""],
        "created_at": ["2026-01-01 10:00:00", "2026-02-01T12:00:00Z", "bad_date", "null"],
    }
    raw_df = pd.DataFrame(raw_data)
    cleaned_df, metrics = transformer.transform(raw_df)

    assert len(cleaned_df) == 4
    assert metrics["source_row_count"] == 4
    assert metrics["cleaned_row_count"] == 4
    assert metrics["dropped_row_count"] == 0

    # ID check
    assert cleaned_df.iloc[0]["id"] == "1"
    assert cleaned_df.iloc[1]["id"] == "2"

    # Name check (stripped, null check using pd.isna)
    assert cleaned_df.iloc[0]["name"] == "Alice"
    assert pd.isna(cleaned_df.iloc[2]["name"])
    assert pd.isna(cleaned_df.iloc[3]["name"])

    # Age check (parsed, coerced invalid to pd.isna)
    assert cleaned_df.iloc[0]["age"] == 25
    assert cleaned_df.iloc[1]["age"] == 30
    assert pd.isna(cleaned_df.iloc[2]["age"])
    assert pd.isna(cleaned_df.iloc[3]["age"])

    # Email check (stripped, lowercased, null check)
    assert cleaned_df.iloc[0]["email"] == "alice@example.com"
    assert cleaned_df.iloc[1]["email"] == "bob@test.com"
    assert pd.isna(cleaned_df.iloc[2]["email"])
    assert pd.isna(cleaned_df.iloc[3]["email"])

    # Timestamp and _extracted_at check
    assert not pd.isna(cleaned_df.iloc[0]["created_at"])
    assert pd.isna(cleaned_df.iloc[2]["created_at"])
    assert "_extracted_at" in cleaned_df.columns
    assert not pd.isna(cleaned_df.iloc[0]["_extracted_at"])


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for transformation tests")
def test_transformer_deduplication():
    from pipeline.transformer import DataTransformer
    transformer = DataTransformer()
    raw_data = {
        "id": ["1", "1", "2"],
        "name": ["Alice V1", "Alice V2", "Bob"],
        "age": [20, 21, 30],
        "email": ["a@a.com", "a@a.com", "b@b.com"],
        "created_at": ["2026-01-01", "2026-01-02", "2026-01-03"],
    }
    raw_df = pd.DataFrame(raw_data)
    cleaned_df, metrics = transformer.transform(raw_df)

    assert len(cleaned_df) == 2
    assert metrics["dropped_row_count"] == 1
    assert list(cleaned_df["id"]) == ["1", "2"]
    assert cleaned_df.iloc[0]["name"] == "Alice V2"


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for transformation tests")
def test_transformer_circuit_breaker_on_excessive_null_ids():
    from pipeline.transformer import DataTransformer
    transformer = DataTransformer(error_threshold_ratio=0.05)
    # 2 out of 10 rows have null IDs -> 20% error rate > 5%
    raw_data = {
        "id": [None, "", "3", "4", "5", "6", "7", "8", "9", "10"],
        "name": [f"User {i}" for i in range(10)],
    }
    raw_df = pd.DataFrame(raw_data)
    with pytest.raises(RuntimeError, match="Circuit breaker triggered"):
        transformer.transform(raw_df)


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for transformation tests")
def test_transformer_empty_dataframe():
    from pipeline.transformer import DataTransformer
    transformer = DataTransformer()
    empty_df = pd.DataFrame()
    cleaned_df, metrics = transformer.transform(empty_df)
    assert cleaned_df.empty
    assert metrics["source_row_count"] == 0
    assert metrics["cleaned_row_count"] == 0
    assert "_extracted_at" in cleaned_df.columns


# 3. Extractor Tests
@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for extractor tests")
def test_extractor_extract_mock_engine(mock_env):
    from pipeline.extractor import PostgresExtractor
    config = PipelineConfig.from_env()
    mock_engine = MagicMock()
    mock_connection = MagicMock()
    mock_engine.connect.return_value.__enter__.return_value = mock_connection

    sample_df = pd.DataFrame({"id": ["1", "2"], "name": ["A", "B"]})
    with patch("pandas.read_sql", return_value=sample_df) as mock_read_sql:
        extractor = PostgresExtractor(config, engine=mock_engine)
        result_df = extractor.extract()
        assert len(result_df) == 2
        mock_read_sql.assert_called_once()


# 4. Loader Tests
@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for loader tests")
def test_loader_dataset_and_table_creation(mock_env):
    from google.cloud.exceptions import NotFound
    from pipeline.loader import BigQueryLoader
    config = PipelineConfig.from_env()
    mock_bq_client = MagicMock()
    # Mock dataset not found first, then created
    mock_bq_client.get_dataset.side_effect = NotFound("Dataset not found")
    # Mock table not found first, then created
    mock_bq_client.get_table.side_effect = [NotFound("Table not found"), MagicMock(num_rows=2)]

    mock_job = MagicMock()
    mock_bq_client.load_table_from_dataframe.return_value = mock_job

    loader = BigQueryLoader(config, client=mock_bq_client)
    df = pd.DataFrame({
        "id": ["1", "2"],
        "name": ["Alice", "Bob"],
        "age": [25, 30],
        "email": ["a@test.com", "b@test.com"],
        "created_at": pd.to_datetime(["2026-01-01", "2026-01-02"], utc=True),
        "_extracted_at": pd.to_datetime(["2026-01-01 12:00:00", "2026-01-02 12:00:00"], utc=True),
    })

    loaded_rows = loader.load(df)
    assert loaded_rows == 2
    mock_bq_client.create_dataset.assert_called_once()
    mock_bq_client.create_table.assert_called_once()
    mock_bq_client.load_table_from_dataframe.assert_called_once()
    mock_job.result.assert_called_once()


# 5. End-to-End Pipeline Runner Test
@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for runner tests")
def test_run_pipeline_end_to_end(mock_env):
    from pipeline.run_postgres_to_bigquery import run_pipeline
    sample_raw_df = pd.DataFrame({
        "id": ["101", " 102 "],
        "name": [" John Doe ", " Jane Smith "],
        "age": ["40", "35"],
        "email": [" JOHN@example.com ", "JANE@example.com"],
        "created_at": ["2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z"],
    })

    with patch("pipeline.extractor.PostgresExtractor.extract", return_value=sample_raw_df), \
         patch("pipeline.loader.BigQueryLoader.load", return_value=2):
        summary = run_pipeline()
        assert summary["status"] == "SUCCESS"
        assert summary["source_row_count"] == 2
        assert summary["cleaned_row_count"] == 2
        assert summary["dropped_row_count"] == 0
        assert summary["loaded_row_count"] == 2
