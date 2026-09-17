"""Unit tests for ETLPipeline orchestration."""
import pytest
from unittest.mock import MagicMock

from server.etl.extractor import GCSExtractor
from server.etl.transformer import DataTransformer
from server.etl.loader import BigQueryLoader
from server.etl.pipeline import ETLPipeline


def test_pipeline_execution_with_override():
    sample_csv = "id,name,role,created_at\n1,Alice,Engineer,2026-01-01\n2,Bob,Analyst,2026-01-02\n"
    pipeline = ETLPipeline()
    summary = pipeline.run(raw_csv_override=sample_csv)

    assert summary["status"] == "SUCCESS"
    assert summary["rows_extracted"] == 2
    assert summary["rows_transformed"] == 2
    assert summary["rows_rejected"] == 0
    assert summary["rows_loaded"] == 2
    assert summary["duration_seconds"] >= 0
    assert "timestamp" in summary
    assert "gcs_source" in summary
    assert "target_table" in summary


def test_pipeline_with_mocked_components():
    mock_extractor = MagicMock(spec=GCSExtractor)
    mock_extractor.source_uri = "gs://sdlc-workspec-store/etl/data/my_file (1).csv"
    mock_extractor.extract_dataframe.return_value = [
        {"id": "A1", "val": "10"},
        {"id": "A2", "val": "20"},
    ]

    mock_loader = MagicMock(spec=BigQueryLoader)
    mock_loader.target_table_ref = "upbeat-repeater-477110-q6.analytics.transformed_data"
    mock_loader.load_transformed_records.return_value = 2

    pipeline = ETLPipeline(
        extractor=mock_extractor,
        loader=mock_loader,
    )

    summary = pipeline.run()

    assert summary["status"] == "SUCCESS"
    assert summary["rows_extracted"] == 2
    assert summary["rows_transformed"] == 2
    assert summary["rows_loaded"] == 2
    mock_extractor.extract_dataframe.assert_called_once()
    mock_loader.ensure_dataset_and_tables.assert_called_once()
    mock_loader.load_transformed_records.assert_called_once()
