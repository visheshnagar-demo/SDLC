"""Unit tests for BigQueryLoader."""
from unittest.mock import MagicMock, patch
import pytest

pd = pytest.importorskip("pandas")
from google.cloud.exceptions import NotFound
from server.pipeline.config import PipelineConfig
from server.pipeline.loader import BigQueryLoader


@pytest.fixture
def test_config():
    return PipelineConfig(
        gcp_project_id="upbeat-repeater-477110-q6",
        bq_dataset="analytics",
        bq_table="test2",
        gcs_source_bucket="sdlc-workspec-store",
    )


@patch("server.pipeline.loader.bigquery.Client")
def test_ensure_dataset_exists_already(mock_bq_client, test_config):
    mock_instance = MagicMock()
    mock_bq_client.return_value = mock_instance

    loader = BigQueryLoader(test_config)
    loader.ensure_dataset_exists()

    mock_instance.get_dataset.assert_called_once()
    mock_instance.create_dataset.assert_not_called()


@patch("server.pipeline.loader.bigquery.Client")
def test_ensure_dataset_creates_when_missing(mock_bq_client, test_config):
    mock_instance = MagicMock()
    mock_instance.get_dataset.side_effect = NotFound("Dataset not found")
    mock_bq_client.return_value = mock_instance

    loader = BigQueryLoader(test_config)
    loader.ensure_dataset_exists()

    mock_instance.get_dataset.assert_called_once()
    mock_instance.create_dataset.assert_called_once()


@patch("server.pipeline.loader.bigquery.Client")
def test_load_dataframe_success(mock_bq_client, test_config):
    mock_instance = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = None
    mock_instance.load_table_from_dataframe.return_value = mock_job
    mock_bq_client.return_value = mock_instance

    loader = BigQueryLoader(test_config)
    df = pd.DataFrame({"rank": [1, 2], "artist": ["Taylor Swift", "Beyonce"]})
    rows_loaded = loader.load_dataframe(df)

    assert rows_loaded == 2
    mock_instance.load_table_from_dataframe.assert_called_once()
    mock_job.result.assert_called_once()


@patch("server.pipeline.loader.bigquery.Client")
def test_load_dataframe_failure(mock_bq_client, test_config):
    mock_instance = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = [{"message": "Invalid schema"}]
    mock_instance.load_table_from_dataframe.return_value = mock_job
    mock_bq_client.return_value = mock_instance

    loader = BigQueryLoader(test_config)
    df = pd.DataFrame({"rank": [1, 2], "artist": ["Taylor Swift", "Beyonce"]})

    with pytest.raises(RuntimeError) as exc_info:
        loader.load_dataframe(df)

    assert "BigQuery load job failed" in str(exc_info.value)
