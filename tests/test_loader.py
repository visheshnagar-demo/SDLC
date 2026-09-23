"""Unit tests for BigQuery Loader."""
import ast
import os
import pytest
from unittest.mock import MagicMock, patch


def test_loader_file_syntax():
    file_path = os.path.join("server", "loader.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None


def test_loader_missing_project_id():
    pd = pytest.importorskip("pandas")
    from server.loader import BigQueryLoader
    loader = BigQueryLoader(project_id="", dataset_id="analytics", table_name="test")
    df = pd.DataFrame({"order_id": [1]})
    with pytest.raises(EnvironmentError):
        loader.load(df)


def test_loader_empty_dataframe_returns_zero():
    pd = pytest.importorskip("pandas")
    from server.loader import BigQueryLoader
    loader = BigQueryLoader(project_id="test-proj", dataset_id="analytics", table_name="test")
    df = pd.DataFrame()
    assert loader.load(df) == 0


def test_loader_success():
    pd = pytest.importorskip("pandas")
    pytest.importorskip("google.cloud.bigquery")
    from server.loader import BigQueryLoader

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
    pd = pytest.importorskip("pandas")
    pytest.importorskip("google.cloud.bigquery")
    from server.loader import BigQueryLoader

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
