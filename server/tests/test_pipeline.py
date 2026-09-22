"""Integration tests for PipelineOrchestrator."""
import pytest
from unittest.mock import MagicMock

pd = pytest.importorskip("pandas")
pydantic = pytest.importorskip("pydantic")

from server.config import ETLConfig
from server.pipeline.orchestrator import PipelineOrchestrator
from server.utils.exceptions import ExtractionError


def test_orchestrator_success():
    config = ETLConfig()
    mock_extractor = MagicMock()
    mock_transformer = MagicMock()
    mock_loader = MagicMock()

    raw_df = pd.DataFrame({"id": [" 101 "], "raw_text": [" test "]})
    cleaned_df = pd.DataFrame({"id": ["101"], "raw_text": ["test"]})

    mock_extractor.extract.return_value = raw_df
    mock_transformer.transform.return_value = cleaned_df
    mock_loader.load.return_value = 1

    orchestrator = PipelineOrchestrator(
        config=config,
        extractor=mock_extractor,
        transformer=mock_transformer,
        loader=mock_loader,
    )

    metrics = orchestrator.run()

    assert metrics["status"] == "SUCCESS"
    assert metrics["rows_extracted"] == 1
    assert metrics["rows_cleaned"] == 1
    assert metrics["rows_loaded"] == 1
    assert metrics["execution_time_seconds"] >= 0.0

    mock_extractor.extract.assert_called_once()
    mock_transformer.transform.assert_called_once_with(raw_df)
    mock_loader.load.assert_called_once_with(cleaned_df)


def test_orchestrator_failure():
    config = ETLConfig()
    mock_extractor = MagicMock()
    mock_extractor.extract.side_effect = ExtractionError("Extraction failed")

    orchestrator = PipelineOrchestrator(
        config=config,
        extractor=mock_extractor,
    )

    with pytest.raises(ExtractionError):
        orchestrator.run()
