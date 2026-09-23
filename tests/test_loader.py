"""Unit tests for BigQueryLoader."""
import pytest
from unittest.mock import MagicMock, patch
from server.etl.loader import BigQueryLoader


def test_loader_missing_env_raises_error():
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(EnvironmentError) as exc_info:
            BigQueryLoader(project_id="", dataset_id="", table_name="")
        assert "GCP_PROJECT" in str(exc_info.value)


def test_loader_initialization():
    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_name="postgres_test2",
        write_disposition="WRITE_TRUNCATE",
    )
    assert loader.project_id == "upbeat-repeater-477110-q6"
    assert loader.dataset_id == "analytics"
    assert loader.table_name == "postgres_test2"
    assert loader.write_disposition == "WRITE_TRUNCATE"


def test_loader_load_none_dataframe_raises():
    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_name="postgres_test2",
    )
    with pytest.raises(ValueError):
        loader.load_dataframe(None)


def test_loader_load_dataframe_success():
    pd = pytest.importorskip("pandas")
    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_name="postgres_test2",
    )
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.job_id = "test-job-123"
    mock_client.load_table_from_dataframe.return_value = mock_job
    
    mock_table = MagicMock()
    mock_table.num_rows = 2
    mock_client.get_table.return_value = mock_table

    df = pd.DataFrame([
        {"id": "1", "raw_data": "record one", "cleaned_at": pd.Timestamp.now(tz="UTC"), "ingested_at": pd.Timestamp.now(tz="UTC")},
        {"id": "2", "raw_data": "record two", "cleaned_at": pd.Timestamp.now(tz="UTC"), "ingested_at": pd.Timestamp.now(tz="UTC")},
    ])

    rows_loaded = loader.load_dataframe(df, client=mock_client)
    assert rows_loaded == 2
    mock_client.load_table_from_dataframe.assert_called_once()
    mock_job.result.assert_called_once()


def test_loader_load_failure_raises_runtime_error():
    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_name="postgres_test2",
    )
    mock_client = MagicMock()
    mock_client.load_table_from_dataframe.side_effect = Exception("BigQuery quota exceeded")

    mock_df = MagicMock()
    mock_df.__len__.return_value = 1

    with pytest.raises(RuntimeError) as exc_info:
        loader.load_dataframe(mock_df, client=mock_client)
    assert "Failed to load data into BigQuery table" in str(exc_info.value)
