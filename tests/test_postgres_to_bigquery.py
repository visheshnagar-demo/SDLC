"""Unit and integration test suite for postgres_to_bigquery pipeline."""
import os
import ast
import json
import pytest

def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "postgres_to_bigquery_dag.py")
    if os.path.isfile(dag_path):
        with open(dag_path, "r", encoding="utf-8") as f:
            code = f.read()
        tree = ast.parse(code)
        assert tree is not None


def test_runner_syntax():
    """Verifies that the pipeline runner has valid syntax."""
    script_path = os.path.join("pipeline", "run_postgres_to_bigquery.py")
    assert os.path.isfile(script_path), f"Runner missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_extractor_syntax():
    """Verifies that the extractor module has valid syntax."""
    extractor_path = os.path.join("pipeline", "extractor.py")
    assert os.path.isfile(extractor_path), f"Extractor missing: {extractor_path}"
    with open(extractor_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_transformer_syntax():
    """Verifies that the transformer module has valid syntax."""
    transformer_path = os.path.join("pipeline", "transformer.py")
    assert os.path.isfile(transformer_path), f"Transformer missing: {transformer_path}"
    with open(transformer_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_loader_syntax():
    """Verifies that the loader module has valid syntax."""
    loader_path = os.path.join("pipeline", "loader.py")
    assert os.path.isfile(loader_path), f"Loader missing: {loader_path}"
    with open(loader_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_schema_definition():
    """Verifies the BigQuery schema file contains expected columns and modes."""
    schema_path = os.path.join("schemas", "postgres_test2_schema.json")
    assert os.path.isfile(schema_path), f"Schema file missing: {schema_path}"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    col_names = [col["name"] for col in schema]
    assert "id" in col_names
    assert "cleaned_payload" in col_names
    assert "created_at" in col_names
    assert "updated_at" in col_names
    assert "etl_ingested_at" in col_names


def test_transformation_clean_and_deduplicate():
    """Tests whitespace trimming, payload column mapping, null handling, and deduplication."""
    pd = pytest.importorskip("pandas")
    from pipeline.transformer import DataTransformer

    transformer = DataTransformer()
    raw_data = {
        "id": [" 101 ", " 102 ", " 101 ", "103", None],
        "data_payload": ["  test payload A  ", "N/A", "  test payload A updated ", "   ", "orphan payload"],
        "created_at": ["2026-01-01 10:00:00", "2026-01-02 11:00:00", "2026-01-01 10:00:00", "2026-01-03 12:00:00", "2026-01-04 13:00:00"],
        "updated_at": ["2026-01-01 10:00:00", "2026-01-02 11:00:00", "2026-01-05 15:00:00", "2026-01-03 12:00:00", "2026-01-04 13:00:00"],
    }
    df_raw = pd.DataFrame(raw_data)
    df_clean = transformer.transform(df_raw)

    # id=None is dropped, duplicate id="101" is deduplicated keeping latest updated_at
    assert len(df_clean) == 3
    assert set(df_clean["id"]) == {"101", "102", "103"}

    row_101 = df_clean[df_clean["id"] == "101"].iloc[0]
    assert row_101["cleaned_payload"] == "test payload A updated"

    row_102 = df_clean[df_clean["id"] == "102"].iloc[0]
    assert pd.isna(row_102["cleaned_payload"])

    row_103 = df_clean[df_clean["id"] == "103"].iloc[0]
    assert pd.isna(row_103["cleaned_payload"])

    # Ensure etl_ingested_at is populated
    assert "etl_ingested_at" in df_clean.columns
    assert not pd.isna(row_101["etl_ingested_at"])


def test_transformation_empty_input():
    """Tests transformer with empty input DataFrame."""
    pd = pytest.importorskip("pandas")
    from pipeline.transformer import DataTransformer

    transformer = DataTransformer()
    df_clean = transformer.transform(pd.DataFrame())
    assert isinstance(df_clean, pd.DataFrame)
    assert len(df_clean) == 0
    assert "id" in df_clean.columns


def test_transformation_circuit_breaker():
    """Tests that transformer raises RuntimeError when 100% of rows are dropped."""
    pd = pytest.importorskip("pandas")
    from pipeline.transformer import DataTransformer

    transformer = DataTransformer()
    df_invalid = pd.DataFrame({"id": [None, None], "data_payload": [None, ""]})
    with pytest.raises(RuntimeError, match="Circuit breaker triggered"):
        transformer.transform(df_invalid)


def test_extractor_missing_config_raises():
    """Verifies that extractor fails fast with EnvironmentError when config is absent."""
    pytest.importorskip("pandas")
    from pipeline.extractor import CloudSQLExtractor

    extractor = CloudSQLExtractor(
        instance_connection_name="",
        db_name="",
        db_user="",
    )
    old_db_url = os.environ.pop("DATABASE_URL", None)
    old_pg_url = os.environ.pop("POSTGRES_URL", None)
    old_inst = os.environ.pop("INSTANCE_CONNECTION_NAME", None)
    old_user = os.environ.pop("POSTGRES_USER", None)
    try:
        with pytest.raises(EnvironmentError):
            extractor.extract()
    finally:
        if old_db_url:
            os.environ["DATABASE_URL"] = old_db_url
        if old_pg_url:
            os.environ["POSTGRES_URL"] = old_pg_url
        if old_inst:
            os.environ["INSTANCE_CONNECTION_NAME"] = old_inst
        if old_user:
            os.environ["POSTGRES_USER"] = old_user


def test_loader_missing_project_raises():
    """Verifies that loader fails fast when GCP project id is missing."""
    pd = pytest.importorskip("pandas")
    from pipeline.loader import BigQueryLoader

    loader = BigQueryLoader(project_id="")
    old_proj = os.environ.pop("GCP_PROJECT_ID", None)
    old_p = os.environ.pop("PROJECT_ID", None)
    try:
        with pytest.raises(EnvironmentError):
            loader.load(pd.DataFrame({"id": ["1"], "cleaned_payload": ["test"]}))
    finally:
        if old_proj:
            os.environ["GCP_PROJECT_ID"] = old_proj
        if old_p:
            os.environ["PROJECT_ID"] = old_p
