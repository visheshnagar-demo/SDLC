import pytest
from unittest.mock import MagicMock
import pandas as pd
from server.bq_loader import BigQueryLoader, POSTGRES_TEST2_BQ_SCHEMA


def test_bq_loader_schema_fields():
    field_names = [f.name for f in POSTGRES_TEST2_BQ_SCHEMA]
    assert "id" in field_names
    assert "name" in field_names
    assert "category" in field_names
    assert "amount" in field_names
    assert "status" in field_names
    assert "created_at" in field_names
    assert "updated_at" in field_names
    assert "_etl_loaded_at" in field_names


def test_bq_loader_empty_df():
    loader = BigQueryLoader(project_id="test-proj", dataset_id="test_ds", table_id="test_tbl")
    result = loader.load_dataframe(pd.DataFrame())

    assert result["status"] == "SKIPPED"
    assert result["rows_loaded"] == 0


def test_bq_loader_mocked_client():
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.job_id = "job-12345"
    mock_client.load_table_from_dataframe.return_value = mock_job

    loader = BigQueryLoader(
        project_id="test-proj",
        dataset_id="analytics",
        table_id="postgres_test2",
        client=mock_client,
    )

    df = pd.DataFrame(
        [
            {"id": "1", "name": "Item 1", "amount": 100.0, "_etl_loaded_at": "2026-01-01T00:00:00Z"}
        ]
    )

    result = loader.load_dataframe(df, write_disposition="WRITE_TRUNCATE")

    assert result["status"] == "SUCCESS"
    assert result["job_id"] == "job-12345"
    assert result["rows_loaded"] == 1
    mock_client.load_table_from_dataframe.assert_called_once()
    mock_job.result.assert_called_once()
