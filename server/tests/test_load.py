"""Unit tests for BigQuery loader module."""

from unittest.mock import MagicMock
import pytest
from server.pipeline.load import _ensure_dataset_exists, load_to_bigquery


def test_ensure_dataset_exists_when_present():
    """Test get_dataset called when dataset exists."""
    mock_client = MagicMock()
    mock_dataset = MagicMock()
    mock_client.get_dataset.return_value = mock_dataset

    result = _ensure_dataset_exists(mock_client, "test-proj", "analytics")
    assert result == mock_dataset
    mock_client.create_dataset.assert_not_called()


def test_ensure_dataset_creates_when_absent():
    """Test create_dataset called when dataset not found."""
    mock_client = MagicMock()
    mock_client.get_dataset.side_effect = Exception("Dataset not found")
    mock_dataset = MagicMock()
    mock_client.create_dataset.return_value = mock_dataset

    result = _ensure_dataset_exists(mock_client, "test-proj", "analytics")
    mock_client.create_dataset.assert_called_once()


def test_load_to_bigquery_success():
    """Test successful load job execution."""
    mock_client = MagicMock()
    mock_dataset = MagicMock()
    mock_client.get_dataset.return_value = mock_dataset

    mock_job = MagicMock()
    mock_job.job_id = "job-12345"
    mock_client.load_table_from_dataframe.return_value = mock_job
    mock_client.load_table_from_json.return_value = mock_job

    mock_table = MagicMock()
    mock_table.num_rows = 1
    mock_client.get_table.return_value = mock_table

    test_data = [
        {
            "rank": 1,
            "artist": "Taylor Swift",
            "tour_title": "The Eras Tour",
            "_etl_loaded_at": "2026-05-18T12:00:00Z",
        }
    ]

    result = load_to_bigquery(
        df=test_data,
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="viswa",
        bq_client=mock_client,
    )

    assert result["status"] == "SUCCESS"
    assert result["job_id"] == "job-12345"
    assert result["target_table"] == "upbeat-repeater-477110-q6.analytics.viswa"


def test_load_to_bigquery_empty_dataframe_raises():
    """Test attempting to load empty data raises RuntimeError."""
    with pytest.raises(RuntimeError, match="Cannot load empty"):
        load_to_bigquery(
            df=[],
            project_id="upbeat-repeater-477110-q6",
            dataset_id="analytics",
            table_id="viswa",
            bq_client=MagicMock(),
        )
