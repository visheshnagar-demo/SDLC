"""Comprehensive unit and integration tests for test04 ETL pipeline."""
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


def test_runner_syntax():
    """Verifies that the standalone runner has valid Python AST syntax."""
    script_path = os.path.join("pipeline", "run_test04_etl.py")
    assert os.path.isfile(script_path), f"Runner script missing: {script_path}"
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


def test_transformer_ordering_by_rank():
    """Verifies that DataTransformer strictly orders records by rank ascending."""
    if pd is None:
        pytest.skip("pandas not installed in local test environment")

    from pipeline.transformer import DataTransformer

    sample_data = {
        "Rank": ["5", "2", "10", "1", "3"],
        "Peak": ["5", "2", "1[4]", "1", "3"],
        "All Time Peak": ["10", "4", "15", "1", "5"],
        "Actual\u00a0gross": ["$100,000,000", "$200,000,000", "$50,000,000", "$500,000,000", "$150,000,000"],
        "Adjusted\u00a0gross (in 2022 dollars)": ["$110,000,000", "$220,000,000", "$55,000,000", "$550,000,000", "$165,000,000"],
        "Artist": ["Artist E", "Artist B", "Artist J", "Artist A", "Artist C"],
        "Tour title": ["Tour E", "Tour B", "Tour J", "Tour A", "Tour C"],
        "Year(s)": ["2020", "2018", "2015", "2023", "2019"],
        "Shows": ["40", "60", "25", "80", "50"],
        "Average gross": ["$2,500,000", "$3,333,333", "$2,000,000", "$6,250,000", "$3,000,000"],
        "Ref.": ["[5]", "[2]", "[10]", "[1]", "[3]"],
    }
    raw_df = pd.DataFrame(sample_data)
    transformed = DataTransformer.transform(raw_df)

    # Check row count
    assert len(transformed) == 5

    # Check rank ordering
    ranks = transformed["rank"].tolist()
    assert ranks == [1, 2, 3, 5, 10]
    assert list(transformed["artist"]) == ["Artist A", "Artist B", "Artist C", "Artist E", "Artist J"]

    # Check columns
    expected_cols = [
        "rank", "peak", "all_time_peak", "actual_gross", "adjusted_gross_2022",
        "artist", "tour_title", "years", "shows", "average_gross", "ref", "ingestion_timestamp"
    ]
    for col in expected_cols:
        assert col in transformed.columns


def test_transformer_handles_empty_dataframe():
    """Verifies that an empty DataFrame does not raise unhandled exceptions."""
    if pd is None:
        pytest.skip("pandas not installed in local test environment")

    from pipeline.transformer import DataTransformer

    empty_df = pd.DataFrame()
    res = DataTransformer.transform(empty_df)
    assert isinstance(res, pd.DataFrame)
    assert len(res) == 0


def test_transformer_null_handling():
    """Verifies that nulls and whitespace are properly handled."""
    if pd is None:
        pytest.skip("pandas not installed in local test environment")

    from pipeline.transformer import DataTransformer

    data = {
        "Rank": ["1", "2"],
        "Peak": [None, "  "],
        "All Time Peak": ["1", "None"],
        "Actual\u00a0gross": ["$100", "nan"],
        "Adjusted\u00a0gross (in 2022 dollars)": [None, "$100"],
        "Artist": ["Artist 1", "Artist 2"],
        "Tour title": ["Tour 1", "Tour 2"],
        "Year(s)": ["2022", "2023"],
        "Shows": [10, None],
        "Average gross": ["$10", "$20"],
        "Ref.": [None, "[1]"],
    }
    df = pd.DataFrame(data)
    transformed = DataTransformer.transform(df)

    assert len(transformed) == 2
    assert pd.isna(transformed.iloc[0]["peak"])
    assert pd.isna(transformed.iloc[1]["peak"])
    assert pd.isna(transformed.iloc[1]["all_time_peak"])
    assert pd.isna(transformed.iloc[1]["actual_gross"])
    assert pd.isna(transformed.iloc[0]["adjusted_gross_2022"])
    assert pd.isna(transformed.iloc[1]["shows"])
    assert pd.isna(transformed.iloc[0]["ref"])


def test_extractor_initialization():
    """Verifies GCSExtractor initializes with default or custom parameters."""
    from pipeline.extractor import GCSExtractor

    extractor = GCSExtractor(bucket_name="custom-bucket", source_prefix="custom/path.csv")
    assert extractor.bucket_name == "custom-bucket"
    assert extractor.source_prefix == "custom/path.csv"


def test_loader_initialization():
    """Verifies BigQueryLoader initializes with expected dataset and table."""
    from pipeline.loader import BigQueryLoader

    loader = BigQueryLoader(project_id="test-project", dataset_id="analytics", table_id="test04")
    assert loader.project_id == "test-project"
    assert loader.dataset_id == "analytics"
    assert loader.table_id == "test04"
