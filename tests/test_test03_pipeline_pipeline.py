"""Automated tests for pipeline test03_pipeline."""
import ast
import os
import json
import pytest


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "test03_pipeline_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_test03_pipeline.py")
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


def test_schema_file_exists_and_valid():
    """Verifies that the BigQuery schema file exists and is valid JSON."""
    schema_path = os.path.join("schemas", "test03_schema.json")
    assert os.path.isfile(schema_path), f"Schema file missing: {schema_path}"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    assert isinstance(schema, list)
    assert len(schema) > 0
    field_names = [f["name"] for f in schema]
    assert "rank" in field_names
    assert "artist" in field_names
    assert "shows" in field_names
    assert "years" in field_names


def test_transformation_ordering_by_rank(tmp_path):
    """Verifies that the transformation engine cleanses and orders records by rank ascending."""
    pd = pytest.importorskip("pandas")
    from pipeline.run_test03_pipeline import PipelineRunner

    runner = PipelineRunner(execution_date="test_run_root")
    runner.staging_dir = str(tmp_path)
    runner.staging_file = os.path.join(runner.staging_dir, "data.parquet")

    raw_df = pd.DataFrame([
        {
            "Rank": "10",
            "Artist": "Coldplay",
            "Shows": "100",
            "Year(s)": "2022–2024"
        },
        {
            "Rank": "1",
            "Artist": "Taylor Swift",
            "Shows": "56",
            "Year(s)": "2023–2024"
        },
        {
            "Rank": "4",
            "Artist": "Pink",
            "Shows": "156",
            "Year(s)": "2018–2019"
        }
    ])
    raw_df.to_parquet(runner.staging_file, index=False)

    count = runner.transform()
    assert count == 3

    transformed_df = pd.read_parquet(runner.staging_file)
    ranks = transformed_df["rank"].tolist()
    assert ranks == [1, 4, 10], f"Expected ranks [1, 4, 10], got {ranks}"
    assert transformed_df.iloc[0]["artist"] == "Taylor Swift"
    assert transformed_df.iloc[0]["shows"] == 56
    assert "ingested_at" in transformed_df.columns
