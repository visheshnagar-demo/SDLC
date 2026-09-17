"""Unit tests for BigQueryLoader."""
import pytest
from unittest.mock import MagicMock
from server.etl.loader import BigQueryLoader


def test_loader_defaults():
    loader = BigQueryLoader()
    assert loader.project_id == "upbeat-repeater-477110-q6"
    assert loader.dataset_id == "analytics"
    assert loader.table_id == "transformed_data"
    assert loader.error_table_id == "analytics_errors"
    assert loader.target_table_ref == "upbeat-repeater-477110-q6.analytics.transformed_data"
    assert loader.error_table_ref == "upbeat-repeater-477110-q6.analytics.analytics_errors"


def test_loader_mock_dry_run():
    loader = BigQueryLoader(dry_run=True)
    records = [{"record_id": "REC-1", "data_payload": "{}"}]
    loaded = loader.load_transformed_records(records)
    assert loaded == 1

    errors = [{"error_id": "ERR-1", "error_message": "failed"}]
    loaded_errors = loader.load_error_records(errors)
    assert loaded_errors == 1


def test_loader_with_mock_client():
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.result.return_value = None
    mock_client.load_table_from_json.return_value = mock_job

    loader = BigQueryLoader(client=mock_client)
    records = [
        {
            "record_id": "REC-100",
            "data_payload": '{"foo": "bar"}',
            "created_at": "2026-09-17T12:00:00Z",
            "_ingestion_timestamp": "2026-09-17T12:00:00Z",
            "_source_file": "gs://sdlc-workspec-store/etl/data/my_file (1).csv",
        }
    ]

    loaded = loader.load_transformed_records(records)
    assert loaded == 1
    mock_client.load_table_from_json.assert_called_once()
    mock_job.result.assert_called_once()
