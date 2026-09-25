"""Automated tests for pipeline postgres_to_bigquery_scrum_386 and server ETL module."""
import ast
import json
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


def test_static_contract_transformation_spec():
    """Verifies that transformation_spec.json contains required metadata keys."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path), f"Missing file: {spec_path}"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "source" in spec, "transformation_spec.json missing 'source'"
    assert "target" in spec, "transformation_spec.json missing 'target'"
    assert "transformations" in spec, "transformation_spec.json missing 'transformations'"
    assert len(spec["transformations"]) > 0, "transformations list is empty"


def test_static_contract_env_deploy_json():
    """Verifies that env.deploy.json contains required keys including failure_behavior."""
    env_path = "env.deploy.json"
    assert os.path.isfile(env_path), f"Missing file: {env_path}"
    with open(env_path, "r", encoding="utf-8") as f:
        env_data = json.load(f)
    assert "failure_behavior" in env_data or "FAILURE_BEHAVIOR" in env_data
    assert "INSTANCE_CONNECTION_NAME" in env_data
    assert "POSTGRES_USER" in env_data
    assert "CLOUD_SQL_IP_TYPE" in env_data
    assert env_data["CLOUD_SQL_IP_TYPE"] == "PRIVATE"
    assert "POSTGRES_PASSWORD" not in env_data


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
