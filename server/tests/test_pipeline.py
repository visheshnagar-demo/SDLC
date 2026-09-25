"""Tests for ETL Pipeline Orchestration."""
import pytest
from unittest.mock import patch

pd = pytest.importorskip("pandas")
from server.etl.config import Settings
from server.etl.pipeline import run_etl_pipeline


@patch("server.etl.pipeline.load_data_to_bigquery")
@patch("server.etl.pipeline.transform_and_clean_data")
@patch("server.etl.pipeline.extract_postgres_data")
def test_run_etl_pipeline_success(mock_extract, mock_transform, mock_load):
    """Verifies complete pipeline orchestration flow."""
    mock_extract.return_value = pd.DataFrame([{"id": "1", "data_payload": "test"}])
    mock_transform.return_value = pd.DataFrame([{"id": "1", "data_payload": "test"}])
    mock_load.return_value = 1

    settings = Settings(
        source_table="test_data",
        bigquery_dataset="analytics",
        bigquery_table="postgres_test3",
    )

    metrics = run_etl_pipeline(settings)

    assert metrics["status"] == "SUCCESS"
    assert metrics["source_table"] == "test_data"
    assert metrics["target_table"] == "analytics.postgres_test3"
    assert metrics["extracted_rows"] == 1
    assert metrics["cleaned_rows"] == 1
    assert metrics["loaded_rows"] == 1
    assert "duration_seconds" in metrics

    mock_extract.assert_called_once_with(settings)
    mock_transform.assert_called_once()
    mock_load.assert_called_once()
