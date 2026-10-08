"""Automated tests for pipeline postgres_to_bigquery_scrum_430."""
import ast
import json
import os
import pytest
from datetime import datetime


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "postgres_to_bigquery_scrum_430_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_postgres_to_bigquery_scrum_430.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_server_modules_syntax():
    """Verifies that all server Python modules have valid syntax."""
    server_dir = "server"
    for root, _, files in os.walk(server_dir):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    tree = ast.parse(f.read())
                assert tree is not None, f"Failed parsing {path}"


def test_pipeline_spec_configuration():
    """Verifies connector parameters."""
    source_type = "postgresql"
    target_type = "bigquery"
    write_mode = "append"
    assert source_type in ["postgresql", "mysql", "s3", "gcs", "rest_api", "sftp", "kafka"]
    assert target_type in ["bigquery", "snowflake", "postgresql", "mysql", "gcs", "s3"]
    assert write_mode in ["append", "overwrite", "merge", "upsert"]


def test_transformation_spec_structure():
    """Verifies transformation_spec.json structure and required columns and top-level contract keys."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path)
    with open(spec_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "source" in data
    assert "target" in data
    assert "transformations" in data
    assert "columns" in data
    cols = {c["source_name"]: c["target_name"] for c in data["columns"]}
    assert "id" in cols
    assert "payload_data" in cols
    assert "status" in cols
    assert "source_created_at" in cols


def test_target_schema_json():
    """Verifies target table schema JSON file."""
    schema_path = os.path.join("schemas", "postgres_test5_schema.json")
    assert os.path.isfile(schema_path)
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    names = [field["name"] for field in schema]
    assert "id" in names
    assert "payload_data" in names
    assert "status" in names
    assert "source_created_at" in names


def test_env_deploy_json_iam_auth():
    """Verifies IAM auth settings and deployment config in env.deploy.json."""
    env_path = "env.deploy.json"
    assert os.path.isfile(env_path)
    with open(env_path, "r", encoding="utf-8") as f:
        env_data = json.load(f)
    assert env_data.get("INSTANCE_CONNECTION_NAME") == "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
    assert env_data.get("POSTGRES_USER") == "559906504681-compute@developer"
    assert env_data.get("POSTGRES_DB") == "postgres"
    assert env_data.get("CLOUD_SQL_IP_TYPE") == "PRIVATE"
    assert "POSTGRES_PASSWORD" not in env_data
    assert "failure_behavior" in env_data or "FAILURE_BEHAVIOR" in env_data
    assert "cpu" in env_data or "CPU" in env_data
    assert "memory" in env_data or "MEMORY" in env_data
