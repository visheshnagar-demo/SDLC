"""Unit tests for BigQueryLoader."""
import pytest
from unittest.mock import patch, MagicMock

pd = pytest.importorskip("pandas")
pydantic = pytest.importorskip("pydantic")
bigquery = pytest.importorskip("google.cloud.bigquery")

from server.config import ETLConfig
from server.pipeline.loader import BigQueryLoader
from server.utils.exceptions import LoadError, ConfigurationError


def test_loader_empty_df():
    config = ETLConfig()
    loader = BigQueryLoader(config=config)
    loaded = loader.load(pd.DataFrame())
    assert loaded == 0


def test_loader_missing_project_id():
    config = ETLConfig(GCP_PROJECT_ID="")
    loader = BigQueryLoader(config=config)
    with pytest.raises(ConfigurationError):
        _ = loader.client


def test_load_records_success():
    config = ETLConfig(
        GCP_PROJECT_ID="test-project",
        BIGQUERY_DATASET="analytics",
        BIGQUERY_TABLE="postgres_test1",
    )
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = None
    mock_client.load_table_from_dataframe.return_value = mock_job

    loader = BigQueryLoader(config=config, client=mock_client)
    df = pd.DataFrame({"id": ["1", "2"], "raw_text": ["a", "b"]})

    count = loader.load(df)
    assert count == 2
    mock_client.load_table_from_dataframe.assert_called_once()
    mock_job.result.assert_called_once()


def test_load_records_job_failure():
    config = ETLConfig(
        GCP_PROJECT_ID="test-project",
        BIGQUERY_DATASET="analytics",
        BIGQUERY_TABLE="postgres_test1",
    )
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = [{"message": "Access Denied"}]
    mock_client.load_table_from_dataframe.return_value = mock_job

    loader = BigQueryLoader(config=config, client=mock_client)
    df = pd.DataFrame({"id": ["1"], "raw_text": ["a"]})

    with pytest.raises(LoadError):
        loader.load(df)
