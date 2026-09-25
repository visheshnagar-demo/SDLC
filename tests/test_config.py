"""Unit tests for PipelineConfig."""
import os
from server.config import PipelineConfig, get_config


def test_pipeline_config_defaults(monkeypatch):
    """Test default configuration parameters."""
    monkeypatch.delenv("GCS_SOURCE_URI", raising=False)
    monkeypatch.delenv("GCP_PROJECT_ID", raising=False)
    monkeypatch.delenv("BQ_DATASET_ID", raising=False)
    monkeypatch.delenv("BQ_TABLE_ID", raising=False)
    monkeypatch.delenv("WRITE_DISPOSITION", raising=False)

    config = get_config()
    assert config.project_id == "upbeat-repeater-477110-q6"
    assert config.dataset_id == "analytics"
    assert config.table_id == "kttest04"
    assert config.write_disposition == "WRITE_TRUNCATE"
    assert "my_file" in config.source_gcs_uri


def test_pipeline_config_env_overrides(monkeypatch):
    """Test environment variable overrides."""
    monkeypatch.setenv("GCS_SOURCE_URI", "gs://test-bucket/test.csv")
    monkeypatch.setenv("GCP_PROJECT_ID", "custom-project")
    monkeypatch.setenv("BQ_DATASET_ID", "custom_dataset")
    monkeypatch.setenv("BQ_TABLE_ID", "custom_table")
    monkeypatch.setenv("WRITE_DISPOSITION", "WRITE_APPEND")

    config = PipelineConfig()
    assert config.source_gcs_uri == "gs://test-bucket/test.csv"
    assert config.project_id == "custom-project"
    assert config.dataset_id == "custom_dataset"
    assert config.table_id == "custom_table"
    assert config.write_disposition == "WRITE_APPEND"
