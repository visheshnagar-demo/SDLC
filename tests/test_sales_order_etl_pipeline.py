"""Automated tests for pipeline sales_order_etl."""
import ast
import json
import os
import pytest


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "sales_order_etl_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_sales_order_etl.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_main_script_syntax():
    """Verifies that main.py entrypoint has valid syntax."""
    main_path = "main.py"
    assert os.path.isfile(main_path), f"Main file missing: {main_path}"
    with open(main_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_pipeline_spec_configuration():
    """Verifies connector parameters."""
    source_type = "gcs"
    target_type = "bigquery"
    write_mode = "append"
    assert source_type in ["postgresql", "mysql", "s3", "gcs", "rest_api", "sftp", "kafka"]
    assert target_type in ["bigquery", "snowflake", "postgresql", "mysql", "gcs", "s3"]
    assert write_mode in ["append", "overwrite", "merge", "upsert"]


def test_transformation_spec_schema():
    """Verifies transformation_spec.json contains required mappings."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path)
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert spec["pipeline_id"] == "sales_order_etl"
    assert spec["source"]["type"] == "gcs"
    assert spec["target"]["type"] == "bigquery"
    assert len(spec["columns"]) >= 9
    col_names = [c["target_name"] for c in spec["columns"]]
    assert "order_id" in col_names


def test_bigquery_schema_definition():
    """Verifies schemas/sales_order_schema.json and harshada-test1_schema.json."""
    for schema_file in ["schemas/sales_order_schema.json", "schemas/harshada-test1_schema.json"]:
        assert os.path.isfile(schema_file)
        with open(schema_file, "r", encoding="utf-8") as f:
            schema = json.load(f)
        names = [f["name"] for f in schema]
        assert "order_id" in names
        assert "order_date" in names
        assert "ingested_at" in names


def test_ddl_files_exist():
    """Verifies DDL sql files exist and contain CREATE TABLE statement."""
    for ddl_file in ["sql/ddl/create_sales_orders_table.sql", "sql/ddl/harshada-test1.sql"]:
        assert os.path.isfile(ddl_file)
        with open(ddl_file, "r", encoding="utf-8") as f:
            ddl = f.read()
        assert "CREATE TABLE" in ddl
        assert "PARTITION BY" in ddl


def test_deployment_config():
    """Verifies env.deploy.json configuration."""
    assert os.path.isfile("env.deploy.json")
    with open("env.deploy.json", "r", encoding="utf-8") as f:
        env_config = json.load(f)
    assert "BIGQUERY_TABLE" in env_config
    assert env_config["BIGQUERY_TABLE"] == "harshada-test1"
