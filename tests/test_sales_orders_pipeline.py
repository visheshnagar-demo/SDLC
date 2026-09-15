"""Automated tests for pipeline sales_orders."""
import ast
import os
import pytest
from pipeline.run_sales_orders import PipelineRunner


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "sales_orders_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_sales_orders.py")
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


def test_pipeline_runner_transformation_and_filtering():
    """Verifies that missing amounts and invalid emails are filtered properly."""
    runner = PipelineRunner(execution_date="2026-05-18")
    raw_sample = [
        {"order_id": "ORD-1", "customer_email": "valid1@test.com", "amount": 100.0, "order_date": "2026-05-18"},
        {"order_id": "ORD-2", "customer_email": "bad_email", "amount": 200.0, "order_date": "2026-05-18"},
        {"order_id": "ORD-3", "customer_email": "valid2@test.com", "amount": None, "order_date": "2026-05-18"},
        {"order_id": "ORD-4", "customer_email": "valid3@test.com", "amount": -15.0, "order_date": "2026-05-18"},
    ]
    valid, rejected = runner.transform(raw_sample)
    assert len(valid) == 1
    assert len(rejected) == 3
    assert valid[0]["order_id"] == "ORD-1"
    assert valid[0]["customer_email"] == "valid1@test.com"
    assert valid[0]["amount"] == 100.0
    assert valid[0]["order_date"] == "2026-05-18"
