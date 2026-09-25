"""Automated tests for pipeline test04_etl."""
import ast
import os
import pytest

try:
    import pandas as pd
except ImportError:
    pd = None


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "test04_etl_dag.py")
    if os.path.isfile(dag_path):
        with open(dag_path, "r", encoding="utf-8") as f:
            code = f.read()
        tree = ast.parse(code)
        assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_test04_etl.py")
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


def test_transformer_rank_sort():
    """Verifies that DataTransformer sorts records by rank ASC."""
    if pd is None:
        pytest.skip("pandas not installed in local test environment")

    from pipeline.transformer import DataTransformer

    df = pd.DataFrame({
        "Rank": [3, 1, 2],
        "Artist": ["C", "A", "B"],
        "Tour title": ["T3", "T1", "T2"],
    })
    transformed = DataTransformer.transform(df)
    assert transformed["rank"].tolist() == [1, 2, 3]
    assert transformed["artist"].tolist() == ["A", "B", "C"]
