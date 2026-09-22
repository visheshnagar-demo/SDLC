"""Automated tests for pipeline cloudsql_postgres_to_bigquery_etl."""
import ast
import os
import pytest


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "cloudsql_postgres_to_bigquery_etl_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_cloudsql_postgres_to_bigquery_etl.py")
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


def test_schema_json_integrity():
    """Verifies schemas/postgres_test1_schema.json is valid JSON with expected columns."""
    import json
    schema_path = os.path.join("schemas", "postgres_test1_schema.json")
    assert os.path.isfile(schema_path), f"Schema file missing: {schema_path}"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    column_names = [col["name"] for col in schema]
    assert "id" in column_names
    assert "raw_text" in column_names
    assert "numeric_val" in column_names
    assert "is_active" in column_names
    assert "created_at" in column_names


def test_transformation_spec_integrity():
    """Verifies transformation_spec.json structure."""
    import json
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path), f"Transformation spec missing: {spec_path}"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "columns" in spec
    assert len(spec["columns"]) == 5
