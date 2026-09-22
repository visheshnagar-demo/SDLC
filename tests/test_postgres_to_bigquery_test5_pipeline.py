"""Automated unit and integration tests for pipeline postgres_to_bigquery_test5."""
import ast
import json
import os
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

try:
    import pandas as pd
except ImportError:
    pd = None


def _find_file(rel_path):
    """Finds a file either relative to cwd or relative to REPO_ROOT."""
    if os.path.isfile(rel_path):
        return rel_path
    abs_path = os.path.join(REPO_ROOT, rel_path)
    if os.path.isfile(abs_path):
        return abs_path
    return rel_path


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = _find_file(os.path.join("dags", "postgres_to_bigquery_test5_dag.py"))
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = _find_file(os.path.join("pipeline", "run_postgres_to_bigquery_test5.py"))
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_pipeline_spec_configuration():
    """Verifies connector parameters and transformation spec."""
    spec_path = _find_file("transformation_spec.json")
    assert os.path.isfile(spec_path), f"Transformation spec file missing: {spec_path}"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert spec["source_table"] == "test_data"
    assert spec["target_table"] == "test5"
    assert len(spec["columns"]) > 0


def test_schema_json_validity():
    """Verifies the BigQuery schema JSON structure."""
    schema_path = _find_file(os.path.join("schemas", "test5_schema.json"))
    assert os.path.isfile(schema_path), f"Schema file missing: {schema_path}"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    assert isinstance(schema, list)
    col_names = [col["name"] for col in schema]
    assert "id" in col_names
    assert "status" in col_names
    assert "value" in col_names
    assert "raw_data" in col_names
    assert "created_at" in col_names
    assert "updated_at" in col_names


def test_ddl_sql_syntax():
    """Verifies DDL file exists and contains expected table name."""
    ddl_path = _find_file(os.path.join("sql", "ddl", "test5.sql"))
    assert os.path.isfile(ddl_path), f"DDL file missing: {ddl_path}"
    with open(ddl_path, "r", encoding="utf-8") as f:
        ddl = f.read()
    assert "CREATE TABLE IF NOT EXISTS" in ddl
    assert "test5" in ddl


def test_deploy_env_config():
    """Verifies required deployment environment variables."""
    env_path = _find_file("env.deploy.json")
    assert os.path.isfile(env_path), f"env.deploy.json missing: {env_path}"
    with open(env_path, "r", encoding="utf-8") as f:
        env_vars = json.load(f)
    assert "INSTANCE_CONNECTION_NAME" in env_vars
    assert "POSTGRES_DB" in env_vars
    assert "POSTGRES_USER" in env_vars
    assert "BIGQUERY_DATASET" in env_vars
    assert "BIGQUERY_TABLE" in env_vars
    assert "POSTGRES_PASSWORD" not in env_vars
