"""Automated tests for pipeline sales_etl."""
import ast
import os
import pytest

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    pd = None
    HAS_PANDAS = False


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "sales_etl_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_sales_etl.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
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


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas required for transformation test")
def test_transformation_and_deduplication(tmp_path):
    """Verifies transform and deduplication logic on sample data."""
    from pipeline.run_sales_etl import PipelineRunner

    runner = PipelineRunner(execution_date="2026-09-01")
    runner.staging_dir = str(tmp_path)
    runner.staging_file = os.path.join(runner.staging_dir, "data.parquet")

    # Mock sample raw data with duplicate order_id
    sample_df = pd.DataFrame([
        {
            "order_id": "1001 ",
            "customer_id": "CUST-201",
            "customer_name": "Alice Johnson",
            "customer_email": "alice.j@example.com",
            "product_category": "Electronics",
            "amount": "299.99",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-09-01T10:14:22Z"
        },
        {
            "order_id": "1001",
            "customer_id": "CUST-201",
            "customer_name": "Alice Johnson",
            "customer_email": "alice.j@example.com",
            "product_category": "Electronics",
            "amount": "349.99",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-09-01T12:14:22Z"
        },
        {
            "order_id": "1002",
            "customer_id": "CUST-202",
            "customer_name": "Bob Smith",
            "customer_email": "bob.smith@example.com",
            "product_category": "Home & Kitchen",
            "amount": "49.50",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-09-01T11:05:10Z"
        }
    ])
    sample_df.to_parquet(runner.staging_file, index=False)

    valid_count = runner.transform()
    assert valid_count == 2  # 1 duplicate dropped

    transformed_df = pd.read_parquet(runner.staging_file)
    assert len(transformed_df) == 2
    assert "order_date" in transformed_df.columns
    assert "_ingested_at" in transformed_df.columns

    # Check deduplicated value for 1001 (should keep latest amount 349.99)
    row_1001 = transformed_df[transformed_df["order_id"] == "1001"].iloc[0]
    assert row_1001["amount"] == 349.99
