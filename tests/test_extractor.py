"""Unit tests for Cloud SQL extractor module."""
import ast
import os
from unittest.mock import MagicMock, patch
import pytest
import pandas as pd
from src.config import PipelineConfig


def test_extractor_module_syntax():
    """Verifies that the extractor module has valid Python syntax."""
    file_path = os.path.join("src", "extractor.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        code = f.read()
    assert ast.parse(code) is not None


@pytest.fixture
def sample_config():
    return PipelineConfig(
        gcp_project="test-project",
        instance_connection_name="test-project:us-central1:test-db",
        db_name="postgres",
        db_user="test-sa@developer",
        source_table="kttest_data",
        bq_dataset="analytics",
        bq_table="postgres_test2",
        cloud_sql_ip_type="PRIVATE",
    )


def test_extractor_initialization(sample_config):
    from src.extractor import CloudSqlExtractor
    extractor = CloudSqlExtractor(sample_config)
    assert extractor.config == sample_config


def test_extractor_extract_success(sample_config):
    from src.extractor import CloudSqlExtractor
    with patch("pandas.read_sql") as mock_read_sql, patch("sqlalchemy.create_engine") as mock_create_engine:
        mock_df = pd.DataFrame({"id": [1, 2], "name": ["Alice", "Bob"]})
        mock_read_sql.return_value = mock_df
        mock_engine = MagicMock()
        mock_create_engine.return_value = mock_engine

        extractor = CloudSqlExtractor(sample_config)
        result_df = extractor.extract()

        assert len(result_df) == 2
        assert list(result_df["name"]) == ["Alice", "Bob"]
        mock_read_sql.assert_called_once()
        mock_engine.dispose.assert_called_once()


def test_extractor_extract_failure(sample_config):
    from src.extractor import CloudSqlExtractor
    with patch("pandas.read_sql", side_effect=Exception("Database connection timeout")), patch("sqlalchemy.create_engine") as mock_create_engine:
        mock_engine = MagicMock()
        mock_create_engine.return_value = mock_engine

        extractor = CloudSqlExtractor(sample_config)
        with pytest.raises(RuntimeError) as exc_info:
            extractor.extract()

        assert "Cloud SQL extraction failed" in str(exc_info.value)
