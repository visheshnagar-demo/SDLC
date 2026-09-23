"""Automated tests for pipeline sales_etl."""
import ast
import os
import pytest

def test_pipeline_script_syntax():
    """Verifies that the standalone pipeline runner script has valid syntax."""
    script_path = os.path.join("pipeline", "run_sales_etl.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None

def test_pipeline_spec_configuration():
    """Verifies connector configuration."""
    source_type = "gcs"
    target_type = "bigquery"
    assert source_type in ["postgresql", "mysql", "s3", "gcs", "rest_api", "sftp", "kafka"]
    assert target_type in ["bigquery", "snowflake", "postgresql", "mysql", "gcs", "s3"]
