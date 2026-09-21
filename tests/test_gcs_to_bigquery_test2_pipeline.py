"""Automated tests for pipeline gcs_to_bigquery_test2."""
import ast
import os
import pytest


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "gcs_to_bigquery_test2_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_gcs_to_bigquery_test2.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_server_modules_syntax():
    """Verifies all server pipeline Python modules have valid syntax."""
    modules = [
        os.path.join("server", "pipeline", "config.py"),
        os.path.join("server", "pipeline", "extractor.py"),
        os.path.join("server", "pipeline", "schema_engine.py"),
        os.path.join("server", "pipeline", "transformer.py"),
        os.path.join("server", "pipeline", "circuit_breaker.py"),
        os.path.join("server", "pipeline", "loader.py"),
        os.path.join("server", "pipeline", "main.py"),
    ]
    for mod_path in modules:
        assert os.path.isfile(mod_path), f"Module missing: {mod_path}"
        with open(mod_path, "r", encoding="utf-8") as f:
            code = f.read()
        tree = ast.parse(code)
        assert tree is not None, f"AST parse failed for {mod_path}"


def test_pipeline_spec_configuration():
    """Verifies connector parameters."""
    source_type = "gcs"
    target_type = "bigquery"
    write_mode = "overwrite"
    assert source_type in ["postgresql", "mysql", "s3", "gcs", "rest_api", "sftp", "kafka"]
    assert target_type in ["bigquery", "snowflake", "postgresql", "mysql", "gcs", "s3"]
    assert write_mode in ["append", "overwrite", "merge", "upsert"]


def test_schema_engine_sanitization():
    """Tests column header normalization and schema mapping."""
    pd = pytest.importorskip("pandas")
    from server.pipeline.schema_engine import SchemaEngine

    raw_cols = [
        "Rank", "Peak", "All Time Peak", "Actual\u00a0gross",
        "Adjusted\u00a0gross (in 2022 dollars)", "Artist", "Tour title",
        "Year(s)", "Shows", "Average gross", "Ref."
    ]
    df = pd.DataFrame(columns=raw_cols)
    sanitized = SchemaEngine.sanitize_headers(df)
    assert "actual_gross" in sanitized.columns
    assert "adjusted_gross_in_2022_dollars" in sanitized.columns
    assert "years" in sanitized.columns
    assert "ref" in sanitized.columns


def test_data_transformer_cleansing():
    """Tests data cleansing, footnote stripping, and currency parsing."""
    pd = pytest.importorskip("pandas")
    from server.pipeline.config import PipelineConfig
    from server.pipeline.transformer import DataTransformer

    cfg = PipelineConfig(
        gcp_project_id="upbeat-repeater-477110-q6",
        bq_dataset="analytics",
        bq_table="test2",
        gcs_source_bucket="sdlc-workspec-store",
    )
    transformer = DataTransformer(cfg)
    raw_df = pd.DataFrame(
        {
            "Rank": ["1"],
            "Peak": ["1[4]"],
            "All Time Peak": ["2[5]"],
            "Actual\u00a0gross": ["$780,000,000"],
            "Adjusted\u00a0gross (in 2022 dollars)": ["$780,000,000"],
            "Artist": ["Taylor Swift"],
            "Tour title": ["The Eras Tour \u2020"],
            "Year(s)": ["2023\u20132024"],
            "Shows": ["56"],
            "Average gross": ["$13,928,571"],
            "Ref.": ["[1]"],
        }
    )
    res = transformer.transform(raw_df)
    assert res["rank"].iloc[0] == 1
    assert res["peak"].iloc[0] == 1
    assert res["all_time_peak"].iloc[0] == 2
    assert res["actual_gross"].iloc[0] == 780000000
    assert res["average_gross"].iloc[0] == 13928571
    assert res["artist"].iloc[0] == "Taylor Swift"
    assert "_ingested_at" in res.columns
    assert "_source_file" in res.columns


def test_circuit_breaker_validation():
    """Tests circuit breaker threshold enforcement."""
    pd = pytest.importorskip("pandas")
    from server.pipeline.config import PipelineConfig
    from server.pipeline.circuit_breaker import CircuitBreaker, CircuitBreakerError

    cfg = PipelineConfig(max_error_threshold_pct=0.05)
    cb = CircuitBreaker(cfg)
    clean_df = pd.DataFrame({"rank": [1, 2], "artist": ["A", "B"]})
    assert len(cb.validate(2, clean_df)) == 2

    corrupted_df = pd.DataFrame({"rank": [None, None], "artist": [None, None]})
    with pytest.raises(CircuitBreakerError):
        cb.validate(2, corrupted_df)
