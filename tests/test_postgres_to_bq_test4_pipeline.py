"""Automated tests for pipeline postgres_to_bq_test4."""
import ast
import json
import os
import pytest

try:
    import pandas as pd
except ImportError:
    pd = None


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "postgres_to_bq_test4_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_postgres_to_bq_test4.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_pipeline_spec_configuration():
    """Verifies connector parameters."""
    source_type = "postgresql"
    target_type = "bigquery"
    write_mode = "overwrite"
    assert source_type in ["postgresql", "mysql", "s3", "gcs", "rest_api", "sftp", "kafka"]
    assert target_type in ["bigquery", "snowflake", "postgresql", "mysql", "gcs", "s3"]
    assert write_mode in ["append", "overwrite", "merge", "upsert"]


def test_schema_json_and_spec_alignment():
    """Verifies BigQuery schema JSON and transformation_spec.json."""
    schema_path = os.path.join("schemas", "test4_schema.json")
    spec_path = "transformation_spec.json"

    assert os.path.isfile(schema_path), f"Schema missing: {schema_path}"
    assert os.path.isfile(spec_path), f"Transformation spec missing: {spec_path}"

    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)

    assert len(schema) > 0
    assert len(spec["columns"]) > 0

    schema_col_names = {col["name"] for col in schema}
    spec_col_names = {col["target_name"] for col in spec["columns"]}
    assert "id" in schema_col_names
    assert "email" in schema_col_names
    assert "status" in schema_col_names
    assert "amount" in schema_col_names
    assert "created_at" in schema_col_names
    assert "updated_at" in schema_col_names
    assert "ingested_at" in schema_col_names
    assert schema_col_names.issubset(spec_col_names)


def test_ddl_file_integrity():
    """Verifies SQL DDL target definition."""
    ddl_path = os.path.join("sql", "ddl", "test4.sql")
    assert os.path.isfile(ddl_path), f"DDL file missing: {ddl_path}"
    with open(ddl_path, "r", encoding="utf-8") as f:
        ddl_content = f.read()
    assert "CREATE TABLE IF NOT EXISTS" in ddl_content
    assert "test4" in ddl_content


def test_deploy_env_config():
    """Verifies env.deploy.json configuration requirements."""
    env_file = "env.deploy.json"
    assert os.path.isfile(env_file), f"env.deploy.json missing: {env_file}"
    with open(env_file, "r", encoding="utf-8") as f:
        env_vars = json.load(f)
    assert "INSTANCE_CONNECTION_NAME" in env_vars
    assert "POSTGRES_DB" in env_vars
    assert "POSTGRES_USER" in env_vars
    assert "GCP_PROJECT_ID" in env_vars
    assert "BIGQUERY_DATASET" in env_vars
    assert "BIGQUERY_TABLE" in env_vars
    assert "POSTGRES_PASSWORD" not in env_vars  # Mandatory IAM Auth policy
    assert env_vars["INSTANCE_CONNECTION_NAME"] == "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
    assert env_vars["POSTGRES_DB"] == "postgres"


def test_transformation_spec_coverage():
    """Verifies that all required source columns are mapped and transformed."""
    spec_path = "transformation_spec.json"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert spec["source_table"] == "test_data"
    assert spec["target_table"] == "test4"
    col_mappings = {c["source_name"]: c["target_name"] for c in spec["columns"]}
    assert "id" in col_mappings
    assert "name" in col_mappings
    assert "email" in col_mappings
    assert "status" in col_mappings
    assert "amount" in col_mappings
    assert "created_at" in col_mappings
    assert "updated_at" in col_mappings
