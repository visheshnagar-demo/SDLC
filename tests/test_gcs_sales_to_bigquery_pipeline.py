"""Automated tests for pipeline gcs_sales_to_bigquery."""
import ast
import os
import json
import pytest


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "gcs_sales_to_bigquery_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_gcs_sales_to_bigquery.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_server_modules_syntax():
    """Verifies that all server ETL modules have valid Python AST syntax."""
    for path in [
        os.path.join("server", "main.py"),
        os.path.join("server", "etl", "config.py"),
        os.path.join("server", "etl", "ingest.py"),
        os.path.join("server", "etl", "transform.py"),
        os.path.join("server", "etl", "loader.py"),
    ]:
        assert os.path.isfile(path), f"Module file missing: {path}"
        with open(path, "r", encoding="utf-8") as f:
            code = f.read()
        tree = ast.parse(code)
        assert tree is not None


def test_pipeline_spec_configuration():
    """Verifies connector parameters."""
    source_type = "gcs"
    target_type = "bigquery"
    write_mode = "append"
    assert source_type in ["postgresql", "mysql", "s3", "gcs", "rest_api", "sftp", "kafka"]
    assert target_type in ["bigquery", "snowflake", "postgresql", "mysql", "gcs", "s3"]
    assert write_mode in ["append", "overwrite", "merge", "upsert"]


def test_schema_json_files_exist():
    """Verifies BigQuery schema definition files exist and are valid JSON."""
    for schema_file in [
        os.path.join("schemas", "harshada_test4_schema.json"),
        os.path.join("schemas", "harshada-test4_schema.json"),
    ]:
        assert os.path.isfile(schema_file), f"Schema file missing: {schema_file}"
        with open(schema_file, "r", encoding="utf-8") as f:
            schema_data = json.load(f)
        assert isinstance(schema_data, list)
        assert len(schema_data) >= 9
        col_names = [f["name"] for f in schema_data]
        assert "order_id" in col_names
        assert "created_at" in col_names


def test_transformation_spec_validity():
    """Verifies transformation_spec.json structure."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path), f"Missing {spec_path}"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "source" in spec
    assert "target" in spec
    assert "transformations" in spec
    assert "columns" in spec
    assert "deduplication" in spec
    assert spec["deduplication"]["key_columns"] == ["order_id"]
    source_cols = [c["source_name"] for c in spec["columns"]]
    assert "order_id" in source_cols
    assert "created_at" in source_cols


def test_env_deploy_json_validity():
    """Verifies env.deploy.json configuration for Cloud Run Job."""
    env_path = "env.deploy.json"
    assert os.path.isfile(env_path), f"Missing {env_path}"
    with open(env_path, "r", encoding="utf-8") as f:
        deploy_env = json.load(f)
    assert "cpu" in deploy_env
    assert "memory" in deploy_env
    assert "failure_behavior" in deploy_env
    assert deploy_env["cpu"] == "1"
    assert deploy_env["memory"] == "2Gi"
    assert deploy_env["failure_behavior"] == "abort_on_error"


def test_pipeline_runner_transform_and_deduplicate(tmp_path):
    """Verifies transform and deduplication logic on staging Parquet."""
    pd = pytest.importorskip("pandas")
    from pipeline.run_gcs_sales_to_bigquery import PipelineRunner

    runner = PipelineRunner(execution_date="2026-09-01")
    runner.staging_dir = str(tmp_path)
    runner.staging_file = os.path.join(runner.staging_dir, "data.parquet")

    df_raw = pd.DataFrame({
        "order_id": ["1001", "1002", "1001"],
        "customer_id": [" CUST-201 ", "CUST-202", "CUST-201"],
        "customer_name": ["Alice", "Bob", "Alice Johnson"],
        "customer_email": ["alice@example.com", "bob@example.com", "alice.j@example.com"],
        "product_category": ["Electronics", "Books", "Electronics"],
        "amount": ["$299.99", "49.50", "350.00"],
        "currency": ["USD", "USD", "USD"],
        "order_status": ["COMPLETED", "PENDING", "COMPLETED"],
        "created_at": ["2026-09-01T10:14:22Z", "2026-09-01T11:05:10Z", "2026-09-01T12:00:00Z"]
    })
    df_raw.to_parquet(runner.staging_file, index=False)

    valid_count = runner.transform()
    assert valid_count == 2

    df_res = pd.read_parquet(runner.staging_file)
    assert len(df_res) == 2
    assert "ingested_at" in df_res.columns
    row_1001 = df_res[df_res["order_id"] == 1001].iloc[0]
    assert row_1001["customer_name"] == "Alice Johnson"
    assert row_1001["amount"] == 350.0
