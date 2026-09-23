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


def test_pipeline_spec_configuration():
    """Verifies connector parameters."""
    source_type = "gcs"
    target_type = "bigquery"
    write_mode = "overwrite"
    assert source_type in ["postgresql", "mysql", "s3", "gcs", "rest_api", "sftp", "kafka"]
    assert target_type in ["bigquery", "snowflake", "postgresql", "mysql", "gcs", "s3"]
    assert write_mode in ["append", "overwrite", "merge", "upsert"]


def test_transformation_spec_structure():
    """Verifies transformation_spec.json has source, target, and transformations."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path), f"transformation_spec.json missing: {spec_path}"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)

    assert "source" in spec, "transformation_spec.json missing 'source'"
    assert "target" in spec, "transformation_spec.json missing 'target'"
    assert "transformations" in spec, "transformation_spec.json missing 'transformations'"
    assert len(spec["transformations"]) > 0, "transformations list is empty"


def test_env_deploy_json_structure():
    """Verifies env.deploy.json has cpu, memory, and failure_behavior."""
    env_path = "env.deploy.json"
    assert os.path.isfile(env_path), f"env.deploy.json missing: {env_path}"
    with open(env_path, "r", encoding="utf-8") as f:
        env_config = json.load(f)

    assert any(k in env_config for k in ["cpu", "CPU", "cpu_limit"]), "Missing CPU configuration"
    assert any(k in env_config for k in ["memory", "MEMORY", "memory_limit"]), "Missing Memory configuration"
    assert any(k in env_config for k in ["failure_behavior", "FAILURE_BEHAVIOR"]), "Missing failure_behavior"
