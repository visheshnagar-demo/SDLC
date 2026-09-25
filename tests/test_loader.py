"""Unit tests for BigQueryTargetLoader."""
from unittest.mock import MagicMock
import pytest
from server.compat import pd, bigquery
from server.config import PipelineConfig
from server.loader import BigQueryTargetLoader


def test_schema_reconciliation():
    """Test schema reconciliation between DataFrame and BigQuery schema fields."""
    config = PipelineConfig()
    loader = BigQueryTargetLoader(config)

    schema_fields = [
        bigquery.SchemaField("rank", "INTEGER", mode="NULLABLE"),
        bigquery.SchemaField("artist", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("missing_col", "STRING", mode="NULLABLE"),
    ]

    df = pd.DataFrame({
        "rank": [1, 2],
        "artist": ["Artist A", "Artist B"],
        "extra_col": ["val1", "val2"]
    })

    reconciled_df, reconciled_schema = loader._reconcile_schema(df, schema_fields)

    assert "missing_col" in reconciled_df.columns
    assert any(f.name == "extra_col" and f.field_type == "STRING" for f in reconciled_schema)


def test_loader_successful_load():
    """Test successful BigQuery batch load."""
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.job_id = "test_job_123"
    mock_client.load_table_from_dataframe.return_value = mock_job

    mock_table = MagicMock()
    mock_table.num_rows = 10
    mock_client.get_table.return_value = mock_table

    config = PipelineConfig(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="kttest04"
    )
    loader = BigQueryTargetLoader(config, bq_client=mock_client)

    df = pd.DataFrame({
        "rank": [1, 2],
        "artist": ["Taylor Swift", "Beyonce"],
        "_ingested_at": [pd.Timestamp.now(), pd.Timestamp.now()]
    })

    summary = loader.load(df)

    assert summary.rows_loaded == 2
    assert summary.job_id == "test_job_123"
    assert summary.target_table == "upbeat-repeater-477110-q6.analytics.kttest04"
    mock_client.load_table_from_dataframe.assert_called_once()


def test_loader_retry_and_failure():
    """Test retry policy and failure escalation."""
    mock_client = MagicMock()
    mock_client.load_table_from_dataframe.side_effect = Exception("BigQuery API Timeout")

    config = PipelineConfig(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="kttest04",
        max_retries=2,
        retry_delay_seconds=0.01
    )
    loader = BigQueryTargetLoader(config, bq_client=mock_client)

    df = pd.DataFrame({"rank": [1]})

    with pytest.raises(RuntimeError) as exc_info:
        loader.load(df)
    assert "Failed to load data into BigQuery table" in str(exc_info.value)
