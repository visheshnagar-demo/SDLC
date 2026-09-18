"""Automated tests for pipeline gcs_to_bigquery_viswa."""
import ast
import os
import json
import pytest
from pipeline.run_gcs_to_bigquery_viswa import (
    sanitize_column_name,
    compute_row_hash,
    PipelineRunner,
)


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "gcs_to_bigquery_viswa_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_gcs_to_bigquery_viswa.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_sanitize_column_name():
    """Tests header normalization for BigQuery compatibility."""
    assert sanitize_column_name("First Name") == "first_name"
    assert sanitize_column_name("Order Total ($)") == "order_total"
    assert sanitize_column_name("IP-Address#") == "ip_address"
    assert sanitize_column_name("  Email Address  ") == "email_address"


def test_compute_row_hash():
    """Tests deterministic row hashing."""
    row1 = {"id": "1", "name": "Test"}
    row2 = {"name": "Test", "id": "1"}
    assert compute_row_hash(row1) == compute_row_hash(row2)
    assert len(compute_row_hash(row1)) == 64


def test_transformation_logic():
    """Tests data transformation, UUID injection, and audit column generation."""
    runner = PipelineRunner(execution_date="2026-09-18")
    raw_sample = [
        {
            "id": "100",
            "First Name": " Viswa ",
            "Last Name": "Nagar",
            "Email": "viswa@example.com",
            "Gender": "NA",
            "IP Address": "10.0.0.1",
        }
    ]
    transformed = runner.transform(raw_sample)
    assert len(transformed) == 1
    record = transformed[0]
    assert record["id"] == 100
    assert record["first_name"] == "Viswa"
    assert record["last_name"] == "Nagar"
    assert record["gender"] is None
    assert "record_id" in record and len(record["record_id"]) > 10
    assert "ingested_at" in record
    assert record["source_file"] == runner.source_uri
    assert "data_hash" in record


def test_pipeline_runner_end_to_end():
    """Tests full pipeline run execution and verify metrics."""
    runner = PipelineRunner(execution_date="2026-09-18")
    status = runner.run()
    assert status == 0
    assert runner.metrics["status"] == "SUCCESS"
    assert runner.metrics["rows_extracted"] > 0
    assert runner.metrics["rows_transformed"] == runner.metrics["rows_extracted"]
    assert runner.metrics["rows_loaded"] == runner.metrics["rows_transformed"]
    assert os.path.isfile(runner.staging_file)


def test_schema_json_definition():
    """Verifies that schemas/viswa_schema.json defines the expected BigQuery fields."""
    schema_path = os.path.join("schemas", "viswa_schema.json")
    assert os.path.isfile(schema_path)
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    col_names = [col["name"] for col in schema]
    assert "record_id" in col_names
    assert "ingested_at" in col_names
    assert "source_file" in col_names
    assert "data_hash" in col_names
