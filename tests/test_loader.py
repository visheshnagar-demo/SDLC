"""Unit tests for BigQuery Loader."""
import ast
import os
import pytest
from unittest.mock import MagicMock, patch

try:
    import pandas as pd
except ImportError:
    pd = None

from server.loader import BigQueryLoader, load_to_bigquery


def test_loader_file_syntax():
    file_path = os.path.join("server", "loader.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None


def test_loader_missing_project_id():
    if pd is None:
        pytest.skip("pandas not installed")
    loader = BigQueryLoader(project_id="", dataset_id="analytics", table_name="test")
    df = pd.DataFrame({"order_id": [1]})
    with pytest.raises(EnvironmentError):
        loader.load(df)


def test_loader_empty_dataframe_returns_zero():
    if pd is None:
        pytest.skip("pandas not installed")
    loader = BigQueryLoader(project_id="test-proj", dataset_id="analytics", table_name="test")
    df = pd.DataFrame()
    assert loader.load(df) == 0


def test_loader_success():
    if pd is None:
        pytest.skip("pandas not installed")

    with patch("server.loader.bigquery.Client") as mock_bq_client_cls:
        mock_client = MagicMock()
        mock_job = MagicMock()
        mock_job.errors = None
        mock_client.load_table_from_dataframe.return_value = mock_job
        mock_bq_client_cls.return_value = mock_client

        loader = BigQueryLoader(project_id="test-proj", dataset_id="analytics", table_name="vishesh-test1")
        df = pd.DataFrame({
            "order_id": [1001],
            "customer_id": ["C1"],
            "created_at": [pd.Timestamp("2026-09-01T10:00:00Z")],
        })

        count = loader.load(df)
        assert count == 1
        mock_client.load_table_from_dataframe.assert_called_once()
        mock_job.result.assert_called_once()


def test_loader_failure_raises_runtime_error():
    if pd is None:
        pytest.skip("pandas not installed")

    with patch("server.loader.bigquery.Client") as mock_bq_client_cls:
        mock_client = MagicMock()
        mock_job = MagicMock()
        mock_job.errors = [{"message": "Invalid partition field"}]
        mock_client.load_table_from_dataframe.return_value = mock_job
        mock_bq_client_cls.return_value = mock_client

        loader = BigQueryLoader(project_id="test-proj", dataset_id="analytics", table_name="vishesh-test1")
        df = pd.DataFrame({
            "order_id": [1001],
            "customer_id": ["C1"],
            "created_at": [pd.Timestamp("2026-09-01T10:00:00Z")],
        })

        with pytest.raises(RuntimeError, match="BigQuery load job failed"):
            loader.load(df)


def test_loader_table_id_parsing():
    loader1 = BigQueryLoader(table_id="my-proj.my-dataset.my-table")
    assert loader1.project_id == "my-proj"
    assert loader1.dataset_id == "my-dataset"
    assert loader1.table_name == "my-table"
    assert loader1.full_table_id == "my-proj.my-dataset.my-table"

    loader2 = BigQueryLoader(table_id="my-dataset.my-table", project_id="fallback-proj")
    assert loader2.project_id == "fallback-proj"
    assert loader2.dataset_id == "my-dataset"
    assert loader2.table_name == "my-table"
