import pytest
from unittest.mock import MagicMock
import pandas as pd
from server.etl_main import run_etl_pipeline, get_latest_status
from server.db_extractor import PostgresExtractor
from server.transformer import DataTransformer
from server.bq_loader import BigQueryLoader


def test_run_etl_pipeline_success():
    # Setup mock extractor
    mock_extractor = MagicMock(spec=PostgresExtractor)
    mock_extractor.extract.return_value = pd.DataFrame(
        [
            {"id": "1", "name": "  Item 1  ", "amount": "100.5", "status": "active"},
            {"id": "1", "name": "Item 1 Duplicate", "amount": "100.5", "status": "active"},
            {"id": "2", "name": "Item 2", "amount": "200.0", "status": "pending"},
        ]
    )

    # Setup mock loader
    mock_loader = MagicMock(spec=BigQueryLoader)
    mock_loader.load_dataframe.return_value = {
        "status": "SUCCESS",
        "job_id": "test-job-99",
        "rows_loaded": 2,
    }

    transformer = DataTransformer()

    result = run_etl_pipeline(
        extractor=mock_extractor,
        transformer=transformer,
        loader=mock_loader,
    )

    assert result["status"] == "SUCCESS"
    assert result["extracted_count"] == 3
    assert result["cleaned_count"] == 2
    assert result["duplicate_count"] == 1
    assert result["loaded_count"] == 2
    assert "duration_seconds" in result

    status = get_latest_status()
    assert status["status"] == "SUCCESS"
    assert status["metrics"]["loaded_count"] == 2


def test_run_etl_pipeline_failure_handling():
    mock_extractor = MagicMock(spec=PostgresExtractor)
    mock_extractor.extract.side_effect = RuntimeError("Database unreachable")

    result = run_etl_pipeline(extractor=mock_extractor)

    assert result["status"] == "FAILED"
    assert "Database unreachable" in result["error"]

    status = get_latest_status()
    assert status["status"] == "FAILED"
    assert "Database unreachable" in status["error"]
