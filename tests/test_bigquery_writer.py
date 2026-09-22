"""Unit tests for the BigQueryWriter module."""
from datetime import date
from unittest.mock import MagicMock
import pytest
from google.cloud.exceptions import NotFound

pd = pytest.importorskip("pandas")

from src.loader.bigquery_writer import BigQueryWriter


def test_ensure_dataset_exists_when_present():
    """Verifies that an existing dataset is returned directly."""
    mock_client = MagicMock()
    mock_dataset = MagicMock()
    mock_client.get_dataset.return_value = mock_dataset

    writer = BigQueryWriter(client=mock_client, project_id="test-project")
    dataset = writer.ensure_dataset_exists("analytics")

    assert dataset == mock_dataset
    mock_client.get_dataset.assert_called_once()
    mock_client.create_dataset.assert_not_called()


def test_ensure_dataset_exists_when_not_found():
    """Verifies that a dataset is created if NotFound is raised."""
    mock_client = MagicMock()
    mock_client.get_dataset.side_effect = NotFound("Dataset not found")
    created_dataset = MagicMock()
    mock_client.create_dataset.return_value = created_dataset

    writer = BigQueryWriter(client=mock_client, project_id="test-project")
    dataset = writer.ensure_dataset_exists("analytics", location="us-central1")

    assert dataset == created_dataset
    mock_client.create_dataset.assert_called_once()


def test_write_dataframe_empty():
    """Verifies that writing an empty DataFrame returns 0 without calling BigQuery."""
    mock_client = MagicMock()
    writer = BigQueryWriter(client=mock_client, project_id="test-project")

    result = writer.write_dataframe(
        df=pd.DataFrame(),
        dataset_id="analytics",
        table_id="harshada-test1",
    )
    assert result == 0
    mock_client.load_table_from_dataframe.assert_not_called()


def test_write_dataframe_missing_partition_field():
    """Verifies ValueError when the partition field is missing from DataFrame."""
    mock_client = MagicMock()
    writer = BigQueryWriter(client=mock_client, project_id="test-project")

    df = pd.DataFrame({"order_id": [1, 2], "amount": [10.0, 20.0]})
    with pytest.raises(ValueError, match="Partition field 'order_date' not present"):
        writer.write_dataframe(
            df=df,
            dataset_id="analytics",
            table_id="harshada-test1",
            partition_field="order_date",
        )


def test_write_dataframe_success():
    """Verifies successful DataFrame write to BigQuery partitioned table."""
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = None
    mock_job.output_rows = 2
    mock_client.load_table_from_dataframe.return_value = mock_job

    writer = BigQueryWriter(client=mock_client, project_id="test-project")

    df = pd.DataFrame({
        "order_id": [101, 102],
        "order_date": [date(2026, 4, 20), date(2026, 4, 21)],
        "amount": [150.0, 200.0],
    })

    rows_loaded = writer.write_dataframe(
        df=df,
        dataset_id="analytics",
        table_id="harshada-test1",
        partition_field="order_date",
    )

    assert rows_loaded == 2
    mock_client.load_table_from_dataframe.assert_called_once()
    mock_job.result.assert_called_once()


def test_write_dataframe_job_errors():
    """Verifies RuntimeError when BigQuery load job reports errors."""
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = [{"message": "Invalid schema mapping"}]
    mock_client.load_table_from_dataframe.return_value = mock_job

    writer = BigQueryWriter(client=mock_client, project_id="test-project")

    df = pd.DataFrame({
        "order_id": [101],
        "order_date": [date(2026, 4, 20)],
    })

    with pytest.raises(RuntimeError, match="BigQuery load job failed with errors"):
        writer.write_dataframe(
            df=df,
            dataset_id="analytics",
            table_id="harshada-test1",
            partition_field="order_date",
        )
