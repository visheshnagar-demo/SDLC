"""Unit tests for BigQuery loader module."""
import ast
import os
from unittest.mock import MagicMock, patch
import pytest
import pandas as pd
from src.config import PipelineConfig


def test_loader_module_syntax():
    """Verifies that the loader module has valid Python syntax."""
    file_path = os.path.join("src", "loader.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        code = f.read()
    assert ast.parse(code) is not None


@pytest.fixture
def sample_config():
    return PipelineConfig(
        gcp_project="test-project",
        instance_connection_name="test-project:us-central1:test-db",
        db_name="postgres",
        db_user="test-sa@developer",
        source_table="kttest_data",
        bq_dataset="analytics",
        bq_table="postgres_test2",
        cloud_sql_ip_type="PRIVATE",
    )


def test_loader_initialization(sample_config):
    from src.loader import BigQueryLoader
    loader = BigQueryLoader(sample_config)
    assert loader.config == sample_config


def test_loader_ensure_dataset_exists(sample_config):
    from src.loader import BigQueryLoader
    with patch("google.cloud.bigquery.Client") as mock_bq_client_cls:
        mock_client = MagicMock()
        mock_bq_client_cls.return_value = mock_client
        loader = BigQueryLoader(sample_config)

        loader.ensure_dataset()
        mock_client.get_dataset.assert_called_once()


def test_loader_ensure_dataset_creates_if_not_found(sample_config):
    from google.cloud.exceptions import NotFound
    from src.loader import BigQueryLoader
    with patch("google.cloud.bigquery.Client") as mock_bq_client_cls:
        mock_client = MagicMock()
        mock_client.get_dataset.side_effect = NotFound("Dataset not found")
        mock_bq_client_cls.return_value = mock_client
        loader = BigQueryLoader(sample_config)

        loader.ensure_dataset()
        mock_client.create_dataset.assert_called_once()


def test_loader_load_dataframe_success(sample_config):
    from src.loader import BigQueryLoader
    with patch("google.cloud.bigquery.Client") as mock_bq_client_cls:
        mock_client = MagicMock()
        mock_job = MagicMock()
        mock_job.result.return_value = None
        mock_client.load_table_from_dataframe.return_value = mock_job
        mock_bq_client_cls.return_value = mock_client

        loader = BigQueryLoader(sample_config)
        df = pd.DataFrame({"id": [1, 2], "name": ["Alice", "Bob"]})
        loaded_count = loader.load(df)

        assert loaded_count == 2
        mock_client.load_table_from_dataframe.assert_called_once()


def test_loader_load_empty_dataframe(sample_config):
    from src.loader import BigQueryLoader
    with patch("google.cloud.bigquery.Client") as mock_bq_client_cls:
        mock_client = MagicMock()
        mock_bq_client_cls.return_value = mock_client

        loader = BigQueryLoader(sample_config)
        df = pd.DataFrame()
        loaded_count = loader.load(df)

        assert loaded_count == 0
        mock_client.load_table_from_dataframe.assert_not_called()
