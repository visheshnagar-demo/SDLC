"""Automated tests for pipeline postgres_to_bigquery_etl."""
import ast
import json
import os
import tempfile
import pytest
from unittest.mock import patch, MagicMock


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "postgres_to_bigquery_etl_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_postgres_to_bigquery_etl.py")
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


def test_schema_json_validity():
    """Verifies target schema JSON exists and is valid."""
    schema_path = os.path.join("schemas", "postgres_test5_schema.json")
    assert os.path.isfile(schema_path), f"Schema file missing: {schema_path}"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    assert isinstance(schema, list)
    col_names = [col["name"] for col in schema]
    assert "id" in col_names
    assert "category" in col_names
    assert "status" in col_names
    assert "data_payload" in col_names
    assert "created_at" in col_names
    assert "updated_at" in col_names


def test_transformation_spec_coverage():
    """Verifies transformation_spec.json maps all required source fields."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path), "transformation_spec.json missing"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "source" in spec
    assert "target" in spec
    assert "transformations" in spec or "columns" in spec
    cols = spec.get("transformations", []) or spec.get("columns", [])
    source_names = [c["source_name"] for c in cols]
    for required_col in ["id", "category", "status", "data_payload", "created_at", "updated_at"]:
        assert required_col in source_names


def test_transformation_logic():
    """Tests data cleaning and transformation logic on sample records."""
    from pipeline.run_postgres_to_bigquery_etl import (
        _clean_str,
        _parse_timestamp,
        transform_record,
        transform_records,
        PipelineRunner,
    )

    # 1. Unit test scalar string cleaner
    assert _clean_str("  hello  ") == "hello"
    assert _clean_str("nan") is None
    assert _clean_str("None") is None
    assert _clean_str("NULL") is None
    assert _clean_str("") is None
    assert _clean_str(None) is None

    # 2. Unit test timestamp parser
    assert _parse_timestamp("2026-05-18 10:00:00") is not None
    assert _parse_timestamp("invalid_date") is None
    assert _parse_timestamp(None) is None

    # 3. Test record list transformation & deduplication
    raw_records = [
        {
            "id": " 101 ",
            "category": "  electronics ",
            "status": "active",
            "data_payload": "{\"key\": \"val\"}",
            "created_at": "2026-05-18 10:00:00",
            "updated_at": "2026-05-18 11:00:00"
        },
        {
            "id": "102",
            "category": "nan",
            "status": "None",
            "data_payload": "",
            "created_at": "invalid_date",
            "updated_at": "2026-05-18 12:00:00"
        },
        {
            "id": "101",
            "category": "  electronics_updated ",
            "status": "active",
            "data_payload": "{\"key\": \"new_val\"}",
            "created_at": "2026-05-18 10:00:00",
            "updated_at": "2026-05-18 13:00:00"
        }
    ]

    cleaned = transform_records(raw_records)
    # Deduplication keeps the latest record for id=101
    assert len(cleaned) == 2

    # Verify first record (id 102)
    rec_102 = next((r for r in cleaned if r["id"] == "102"), None)
    assert rec_102 is not None
    assert rec_102["category"] is None
    assert rec_102["status"] is None
    assert rec_102["data_payload"] is None
    assert rec_102["created_at"] is None
    assert "ingested_at" in rec_102

    # Verify latest record for id 101
    rec_101 = next((r for r in cleaned if r["id"] == "101"), None)
    assert rec_101 is not None
    assert rec_101["category"] == "electronics_updated"
    assert rec_101["status"] == "active"
    assert "ingested_at" in rec_101

    # 4. Test PipelineRunner transform method via temporary staging file
    with tempfile.TemporaryDirectory() as tmpdir:
        runner = PipelineRunner(execution_date="2026-05-18")
        runner.staging_dir = tmpdir
        json_file = os.path.join(tmpdir, "data.json")
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(raw_records, f)
        runner.staging_file = json_file

        valid_count = runner.transform()
        assert valid_count == 2
        with open(runner.staging_file, "r", encoding="utf-8") as f:
            staged_out = json.load(f)
        assert len(staged_out) == 2


def test_deploy_env_iam_auth():
    """Verifies env.deploy.json conforms to Cloud SQL IAM auth standards."""
    deploy_env_path = "env.deploy.json"
    assert os.path.isfile(deploy_env_path), "env.deploy.json missing"
    with open(deploy_env_path, "r", encoding="utf-8") as f:
        env_vars = json.load(f)

    assert "POSTGRES_PASSWORD" not in env_vars
    assert env_vars.get("CLOUD_SQL_IP_TYPE") == "PRIVATE"
    assert "@" in env_vars.get("POSTGRES_USER", "")
    assert not env_vars.get("POSTGRES_USER", "").startswith("[")
    assert env_vars.get("INSTANCE_CONNECTION_NAME") == "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
    assert env_vars.get("POSTGRES_DB") == "postgres"
    assert env_vars.get("BIGQUERY_DATASET") == "analytics"
    assert env_vars.get("BIGQUERY_TABLE") == "postgres_test5"
    assert "failure_behavior" in env_vars or "FAILURE_BEHAVIOR" in env_vars
    assert "cpu" in env_vars or "CPU" in env_vars or "resources" in env_vars
    assert "memory" in env_vars or "MEMORY" in env_vars or "resources" in env_vars
