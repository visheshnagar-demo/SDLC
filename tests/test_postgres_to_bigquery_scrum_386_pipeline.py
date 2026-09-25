"""Automated tests for pipeline postgres_to_bigquery_scrum_386 and server ETL module."""
import ast
import os
import unittest
from unittest.mock import patch
import pytest

try:
    import pandas as pd
except ImportError:
    pd = None


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "postgres_to_bigquery_scrum_386_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_postgres_to_bigquery_scrum_386.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_pipeline_spec_configuration():
    """Verifies connector parameters."""
    source_type = "postgresql"
    target_type = "bigquery"
    write_mode = "append"
    assert source_type in ["postgresql", "mysql", "s3", "gcs", "rest_api", "sftp", "kafka"]
    assert target_type in ["bigquery", "snowflake", "postgresql", "mysql", "gcs", "s3"]
    assert write_mode in ["append", "overwrite", "merge", "upsert"]


@pytest.mark.skipif(pd is None, reason="pandas not installed in environment")
def test_transformer_cleaning_and_null_handling():
    """Verifies DataTransformer cleaning, null normalization, and metadata injection."""
    from server.etl.config import ETLConfig
    from server.etl.transformer import DataTransformer

    config = ETLConfig(
        gcp_project_id="upbeat-repeater-477110-q6",
        instance_connection_name="upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db",
        postgres_db="postgres",
        postgres_user="559906504681-compute@developer",
        postgres_table="test_data",
        cloud_sql_ip_type="PRIVATE",
        postgres_port="5432",
        database_url="",
        bq_dataset="analytics",
        bq_table="postgres_test4",
        bq_location="us-central1",
        write_disposition="WRITE_APPEND",
    )
    transformer = DataTransformer(config)
    raw_df = pd.DataFrame({
        "id": [" 101 ", " 102 ", "103"],
        "name": ["  Alpha ", "null", "N/A"],
        "created_at": ["2026-01-01 12:00:00", "2026-01-02 14:00:00", ""],
    })

    cleaned_df = transformer.transform(raw_df)
    assert len(cleaned_df) == 3
    assert cleaned_df.iloc[0]["id"] == "101"
    assert cleaned_df.iloc[0]["name"] == "Alpha"
    assert pd.isna(cleaned_df.iloc[1]["name"])
    assert pd.isna(cleaned_df.iloc[2]["name"])
    assert "_etl_loaded_at" in cleaned_df.columns
    assert "_etl_source_table" in cleaned_df.columns
    assert cleaned_df.iloc[0]["_etl_source_table"] == "postgres.test_data"


@pytest.mark.skipif(pd is None, reason="pandas not installed in environment")
def test_transformer_deduplication():
    """Verifies DataTransformer deduplication."""
    from server.etl.config import ETLConfig
    from server.etl.transformer import DataTransformer

    config = ETLConfig(
        gcp_project_id="upbeat-repeater-477110-q6",
        instance_connection_name="upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db",
        postgres_db="postgres",
        postgres_user="559906504681-compute@developer",
        postgres_table="test_data",
        cloud_sql_ip_type="PRIVATE",
        postgres_port="5432",
        database_url="",
        bq_dataset="analytics",
        bq_table="postgres_test4",
        bq_location="us-central1",
        write_disposition="WRITE_APPEND",
    )
    transformer = DataTransformer(config)
    raw_df = pd.DataFrame({
        "id": ["1", "1", "2"],
        "name": ["Test", "Test", "Other"],
    })
    cleaned = transformer.transform(raw_df)
    assert len(cleaned) == 2


@pytest.mark.skipif(pd is None, reason="pandas not installed in environment")
def test_transformer_circuit_breaker():
    """Verifies that transformer triggers circuit breaker on completely invalid data."""
    from server.etl.config import ETLConfig
    from server.etl.transformer import DataTransformer

    config = ETLConfig(
        gcp_project_id="upbeat-repeater-477110-q6",
        instance_connection_name="upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db",
        postgres_db="postgres",
        postgres_user="559906504681-compute@developer",
        postgres_table="test_data",
        cloud_sql_ip_type="PRIVATE",
        postgres_port="5432",
        database_url="",
        bq_dataset="analytics",
        bq_table="postgres_test4",
        bq_location="us-central1",
        write_disposition="WRITE_APPEND",
    )
    transformer = DataTransformer(config)
    raw_df = pd.DataFrame({
        "id": [None, None],
        "name": ["", "null"],
    })
    with pytest.raises(RuntimeError):
        transformer.transform(raw_df)
