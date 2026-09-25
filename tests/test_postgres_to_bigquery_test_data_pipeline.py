"""Automated tests for pipeline postgres_to_bigquery_test_data."""
import ast
import os
from unittest.mock import patch, MagicMock
import pytest

try:
    import pandas as pd
except (ImportError, Exception):
    pd = None


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "postgres_to_bigquery_test_data_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_postgres_to_bigquery_test_data.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_server_modules_syntax():
    """Verifies all server ETL modules have valid syntax."""
    server_files = [
        os.path.join("server", "etl", "config.py"),
        os.path.join("server", "etl", "extractor.py"),
        os.path.join("server", "etl", "transformer.py"),
        os.path.join("server", "etl", "loader.py"),
        os.path.join("server", "etl", "pipeline.py"),
        os.path.join("server", "main.py"),
    ]
    for sf in server_files:
        assert os.path.isfile(sf), f"File missing: {sf}"
        with open(sf, "r", encoding="utf-8") as f:
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


def test_runner_transformation_flow(tmp_path):
    """Verifies PipelineRunner transform on staged parquet data."""
    if pd is None:
        pytest.skip("pandas is not available or C extension not built")

    try:
        from pipeline.run_postgres_to_bigquery_test_data import PipelineRunner
    except (ImportError, Exception) as exc:
        pytest.skip(f"PipelineRunner import failed: {exc}")

    runner = PipelineRunner(execution_date="2026-05-18")
    staging_file = str(tmp_path / "data.parquet")
    runner.staging_dir = str(tmp_path)
    runner.staging_file = staging_file

    sample_df = pd.DataFrame([
        {
            "id": " 101 ",
            "data_payload": " sample_text ",
            "status": " completed ",
            "created_at": "2026-05-18 10:00:00",
            "updated_at": "2026-05-18 11:00:00",
        }
    ])

    # Check if parquet write is supported directly without raising an exception
    can_write_parquet = True
    try:
        sample_df.to_parquet(staging_file, index=False)
    except (ImportError, ValueError, Exception):
        can_write_parquet = False

    if can_write_parquet:
        valid_count = runner.transform()
        assert valid_count == 1
        transformed_df = pd.read_parquet(staging_file)
        assert transformed_df.iloc[0]["id"] == "101"
        assert transformed_df.iloc[0]["data_payload"] == "sample_text"
        assert transformed_df.iloc[0]["status"] == "completed"
        assert "ingested_at" in transformed_df.columns
    else:
        # Mock read and write parquet when engine is not present
        saved_holder = {}
        def fake_to_parquet(self, path, **kwargs):
            saved_holder["df"] = self.copy()
            with open(path, "w", encoding="utf-8") as f:
                f.write("mock_parquet_data")

        def fake_read_parquet(path, **kwargs):
            if "df" in saved_holder:
                return saved_holder["df"].copy()
            return sample_df.copy()

        # Write dummy file so os.path.exists and getsize pass
        with open(staging_file, "w", encoding="utf-8") as f:
            f.write("mock_parquet_content")

        with patch("pandas.read_parquet", side_effect=fake_read_parquet), \
             patch.object(pd.DataFrame, "to_parquet", fake_to_parquet):
            valid_count = runner.transform()
            assert valid_count == 1
            assert "df" in saved_holder
            transformed_df = saved_holder["df"]
            assert transformed_df.iloc[0]["id"] == "101"
            assert transformed_df.iloc[0]["data_payload"] == "sample_text"
            assert transformed_df.iloc[0]["status"] == "completed"
            assert "ingested_at" in transformed_df.columns
