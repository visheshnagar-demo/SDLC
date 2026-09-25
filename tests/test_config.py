"""Unit tests for configuration module."""
import os
import pytest
from src.config import PipelineConfig


def test_config_from_env_defaults(monkeypatch):
    """Verifies default configuration values."""
    monkeypatch.delenv("GCP_PROJECT_ID", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    monkeypatch.delenv("INSTANCE_CONNECTION_NAME", raising=False)
    monkeypatch.delenv("POSTGRES_DB", raising=False)
    monkeypatch.delenv("POSTGRES_USER", raising=False)
    monkeypatch.delenv("SOURCE_TABLE", raising=False)
    monkeypatch.delenv("BIGQUERY_DATASET", raising=False)
    monkeypatch.delenv("BIGQUERY_TABLE", raising=False)

    config = PipelineConfig.from_env()
    assert config.gcp_project == "upbeat-repeater-477110-q6"
    assert config.instance_connection_name == "upbeat-repeater-477110-q6:us-central1:sdlc-etldemo-db"
    assert config.db_name == "postgres"
    assert config.db_user == "559906504681-compute@developer"
    assert config.source_table == "kttest_data"
    assert config.bq_dataset == "analytics"
    assert config.bq_table == "postgres_test2"
    assert config.cloud_sql_ip_type == "PRIVATE"


def test_config_from_env_custom(monkeypatch):
    """Verifies custom configuration overrides."""
    monkeypatch.setenv("GCP_PROJECT_ID", "custom-project")
    monkeypatch.setenv("INSTANCE_CONNECTION_NAME", "custom-project:region:instance")
    monkeypatch.setenv("POSTGRES_DB", "custom_db")
    monkeypatch.setenv("POSTGRES_USER", "custom_user")
    monkeypatch.setenv("SOURCE_TABLE", "custom_src")
    monkeypatch.setenv("BIGQUERY_DATASET", "custom_ds")
    monkeypatch.setenv("BIGQUERY_TABLE", "custom_tbl")
    monkeypatch.setenv("CLOUD_SQL_IP_TYPE", "PUBLIC")

    config = PipelineConfig.from_env()
    assert config.gcp_project == "custom-project"
    assert config.instance_connection_name == "custom-project:region:instance"
    assert config.db_name == "custom_db"
    assert config.db_user == "custom_user"
    assert config.source_table == "custom_src"
    assert config.bq_dataset == "custom_ds"
    assert config.bq_table == "custom_tbl"
    assert config.cloud_sql_ip_type == "PUBLIC"
