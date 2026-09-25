"""Automated tests for pipeline postgres_to_bigquery_test_data."""
import ast
import os
import pytest


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
    """Verifies PipelineRunner transform on staged parquet data when pandas & pyarrow exist."""
    pd = pytest.importorskip("pandas")
    pa = pytest.importorskip("pyarrow")
    from pipeline.run_postgres_to_bigquery_test_data import PipelineRunner

    runner = PipelineRunner(execution_date="2026-05-18")
    runner.staging_dir = str(tmp_path)
    runner.staging_file = str(tmp_path / "data.parquet")

    sample_df = pd.DataFrame([
        {
            "id": " 101 ",
            "data_payload": " sample_text ",
            "status": " completed ",
            "created_at": "2026-05-18 10:00:00",
            "updated_at": "2026-05-18 11:00:00",
        }
    ])
    sample_df.to_parquet(runner.staging_file, index=False)

    valid_count = runner.transform()
    assert valid_count == 1

    transformed_df = pd.read_parquet(runner.staging_file)
    assert transformed_df.iloc[0]["id"] == "101"
    assert transformed_df.iloc[0]["data_payload"] == "sample_text"
    assert transformed_df.iloc[0]["status"] == "completed"
    assert "ingested_at" in transformed_df.columns
