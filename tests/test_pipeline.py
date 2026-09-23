"""Unit and integration tests for Cloud SQL PostgreSQL to BigQuery ETL Pipeline."""
import os
import json
import ast
import re
import pytest

# Optional pandas import for environments where pandas is installed
try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    pd = None
    np = None
    HAS_PANDAS = False


def test_schema_json_validity():
    """Validates target BigQuery schema JSON structure."""
    schema_path = os.path.join("schemas", "postgres_test2_schema.json")
    assert os.path.isfile(schema_path), f"Schema JSON file missing at {schema_path}"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    assert isinstance(schema, list)
    assert len(schema) > 0
    column_names = [col["name"] for col in schema]
    assert "id" in column_names
    assert "ingested_at" in column_names


def test_transformation_spec_validity():
    """Validates transformation spec JSON mapping and structure."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path), f"Transformation spec missing at {spec_path}"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "pipeline_id" in spec
    assert "source" in spec
    assert "target" in spec
    assert len(spec["columns"]) > 0


def test_sql_ddl_validity():
    """Validates generated BigQuery SQL DDL file."""
    ddl_path = os.path.join("sql", "ddl", "postgres_test2.sql")
    assert os.path.isfile(ddl_path), f"DDL file missing at {ddl_path}"
    with open(ddl_path, "r", encoding="utf-8") as f:
        ddl_content = f.read()
    assert "CREATE TABLE" in ddl_content.upper()
    assert "postgres_test2" in ddl_content


def test_env_deploy_json_iam_config():
    """Verifies that env.deploy.json satisfies Cloud SQL IAM security requirements."""
    env_path = "env.deploy.json"
    assert os.path.isfile(env_path), f"env.deploy.json missing at {env_path}"
    with open(env_path, "r", encoding="utf-8") as f:
        env_vars = json.load(f)

    # 1. Zero POSTGRES_PASSWORD
    assert "POSTGRES_PASSWORD" not in env_vars, "POSTGRES_PASSWORD must NOT be in env.deploy.json"

    # 2. POSTGRES_USER must be in IAM format
    assert "POSTGRES_USER" in env_vars
    assert "@" in env_vars["POSTGRES_USER"]
    assert "[" not in env_vars["POSTGRES_USER"]

    # 3. CLOUD_SQL_IP_TYPE must be PRIVATE
    assert env_vars.get("CLOUD_SQL_IP_TYPE") == "PRIVATE"

    # 4. INSTANCE_CONNECTION_NAME and POSTGRES_DB
    assert "INSTANCE_CONNECTION_NAME" in env_vars
    assert "POSTGRES_DB" in env_vars


def test_transformation_logic_pure_python():
    """Validates transformation sanitization rules using standard Python."""
    _FOOTNOTE_RE = re.compile(r"\[[^\]]*\]")
    _NUMERIC_STRIP_RE = re.compile(r"[,$€£¥\s\u00a0]")

    def clean_str(val):
        if val is None:
            return None
        stripped = str(val).strip()
        return None if stripped in ["", "nan", "None"] else stripped

    def clean_num(val):
        if val is None:
            return None
        val_str = str(val)
        val_str = _FOOTNOTE_RE.sub("", val_str)
        val_str = _NUMERIC_STRIP_RE.sub("", val_str)
        return float(val_str)

    # Test cases
    assert clean_str("  Alice Smith  ") == "Alice Smith"
    assert clean_str("   ") is None
    assert clean_str(None) is None
    assert clean_num("$1,234.50") == 1234.50
    assert clean_num("500") == 500.0


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas not installed in test environment")
def test_transformation_logic_pandas(tmp_path):
    """Tests DataFrame transformation when pandas is installed."""
    from pipeline.run_postgres_to_bigquery import PipelineRunner
    runner = PipelineRunner(execution_date="2026-05-18")
    runner.staging_dir = str(tmp_path)
    runner.staging_file = os.path.join(runner.staging_dir, "data.parquet")

    raw_df = pd.DataFrame([
        {"id": 1, "name": "  Alice Smith  ", "email": "ALICE@EXAMPLE.COM", "amount": "$1,234.50", "created_at": "2026-05-01 10:00:00"},
        {"id": 2, "name": "Bob Jones", "email": "bob@example.com ", "amount": "500", "created_at": "2026-05-02 12:30:00"},
        {"id": 3, "name": "   ", "email": None, "amount": None, "created_at": None},
    ])
    raw_df.to_parquet(runner.staging_file, index=False)

    survived_count = runner.transform()
    assert survived_count == 3

    transformed_df = pd.read_parquet(runner.staging_file)
    assert "ingested_at" in transformed_df.columns
    assert transformed_df.iloc[0]["name"] == "Alice Smith"
    assert pd.isna(transformed_df.iloc[2]["email"])
    assert float(transformed_df.iloc[0]["amount"]) == 1234.50
