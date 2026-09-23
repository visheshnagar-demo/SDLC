"""Unit and end-to-end orchestration tests for ETLPipeline."""
import pytest
from unittest.mock import MagicMock
from server.etl.pipeline import ETLPipeline


def test_pipeline_initialization():
    pipeline = ETLPipeline(
        source_table="test_data",
        target_dataset="analytics",
        target_table="postgres_test2",
        extractor=MagicMock(),
        transformer=MagicMock(),
        loader=MagicMock(),
    )
    assert pipeline.source_table == "test_data"
    assert pipeline.target_dataset == "analytics"
    assert pipeline.target_table == "postgres_test2"


def test_pipeline_run_success():
    pd = pytest.importorskip("pandas")
    mock_extractor = MagicMock()
    mock_extractor.extract_table.return_value = pd.DataFrame([
        {"id": " 1 ", "raw_data": "  sample A  ", "cleaned_at": "2025-01-01T00:00:00Z"},
        {"id": " 2 ", "raw_data": "null", "cleaned_at": None},
        {"id": " 1 ", "raw_data": "  sample A updated  ", "cleaned_at": "2025-01-01T01:00:00Z"},
    ])

    mock_loader = MagicMock()
    mock_loader.load_dataframe.return_value = 2

    pipeline = ETLPipeline(
        source_table="test_data",
        target_dataset="analytics",
        target_table="postgres_test2",
        extractor=mock_extractor,
        loader=mock_loader,
    )

    metrics = pipeline.run()

    assert metrics.status == "SUCCESS"
    assert metrics.rows_extracted == 3
    assert metrics.rows_cleaned == 2
    assert metrics.rows_deduplicated == 1
    assert metrics.rows_loaded == 2
    assert metrics.execution_duration_sec >= 0.0
    mock_extractor.extract_table.assert_called_once_with(table_name="test_data")
    mock_loader.load_dataframe.assert_called_once()


def test_pipeline_run_extraction_failure_propagates():
    mock_extractor = MagicMock()
    mock_extractor.extract_table.side_effect = RuntimeError("Extraction connection error")

    pipeline = ETLPipeline(
        source_table="test_data",
        target_dataset="analytics",
        target_table="postgres_test2",
        extractor=mock_extractor,
        loader=MagicMock(),
    )

    with pytest.raises(RuntimeError) as exc_info:
        pipeline.run()
    assert "Extraction connection error" in str(exc_info.value)
