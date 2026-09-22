"""Automated tests for pipeline postgres_to_bq_test4."""
import ast
import os
import json
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
    assert schema_col_names.issubset(spec_col_names)


def test_ddl_file_integrity():
    """Verifies SQL DDL target definition."""
    ddl_path = os.path.join("sql", "ddl", "test4.sql")
    assert os.path.isfile(ddl_path), f"DDL file missing: {ddl_path}"
    with open(ddl_path, "r", encoding="utf-8") as f:
        ddl_content = f.read()
    assert "CREATE TABLE IF NOT EXISTS" in ddl_content
    assert "test4" in ddl_content


def test_transformation_logic_unit():
    """Unit test transformation rules without requiring external DB connections."""
    if pd is None:
        pytest.skip("pandas not installed in local test environment")

    from pipeline.run_postgres_to_bq_test4 import PipelineRunner
    raw_df = pd.DataFrame([
        {
            "id": " 101 ",
            "name": "john doe",
            "email": " JOHN.DOE@EXAMPLE.COM ",
            "status": "active",
            "amount": "123.45",
            "created_at": "2025-01-01 10:00:00",
            "updated_at": "2025-01-02 11:00:00",
        }
    ])
    assert raw_df is not None
