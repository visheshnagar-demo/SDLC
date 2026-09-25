"""Unit tests for pipeline orchestrator module."""
import ast
import os
from unittest.mock import MagicMock, patch
import pytest
import pandas as pd


def test_orchestrator_module_syntax():
    """Verifies that the orchestrator module has valid Python syntax."""
    file_path = os.path.join("src", "orchestrator.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        code = f.read()
    assert ast.parse(code) is not None


def test_run_pipeline_success():
    from src.orchestrator import run_pipeline

    with patch("src.orchestrator.BigQueryLoader") as mock_loader_cls, \
         patch("src.orchestrator.DataSanitizer") as mock_sanitizer_cls, \
         patch("src.orchestrator.CloudSqlExtractor") as mock_extractor_cls:

        mock_extractor = MagicMock()
        mock_df = pd.DataFrame({"id": [1, 2], "name": ["Alice", "Bob"]})
        mock_extractor.extract.return_value = mock_df
        mock_extractor_cls.return_value = mock_extractor

        mock_sanitizer = MagicMock()
        mock_clean_df = pd.DataFrame({"id": [1, 2], "name": ["Alice", "Bob"]})
        metrics_mock = MagicMock()
        metrics_mock.extracted_count = 2
        metrics_mock.duplicates_removed = 0
        metrics_mock.nulls_sanitized = 0
        mock_sanitizer.clean.return_value = (mock_clean_df, metrics_mock)
        mock_sanitizer_cls.return_value = mock_sanitizer

        mock_loader = MagicMock()
        mock_loader.load.return_value = 2
        mock_loader_cls.return_value = mock_loader

        result = run_pipeline()
        assert result["rows_extracted"] == 2
        assert result["rows_loaded"] == 2
        assert result["duplicates_removed"] == 0


def test_run_pipeline_empty_source():
    from src.orchestrator import run_pipeline

    with patch("src.orchestrator.CloudSqlExtractor") as mock_extractor_cls:
        mock_extractor = MagicMock()
        mock_extractor.extract.return_value = pd.DataFrame()
        mock_extractor_cls.return_value = mock_extractor

        result = run_pipeline()
        assert result["rows_extracted"] == 0
        assert result["rows_loaded"] == 0
