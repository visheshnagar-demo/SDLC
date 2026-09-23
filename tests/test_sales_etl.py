"""Unit and integration tests for Sales ETL Pipeline (SCRUM-355)."""
import os
import json
import ast
import pytest

try:
    import pandas as pd
except ImportError:
    pd = None


def test_schema_json_validity():
    """Verify schema JSON files are valid and contain all required columns."""
    for schema_file in ["schemas/cleaned_sales_schema.json", "schemas/sales_data_schema.json"]:
        assert os.path.exists(schema_file), f"Missing schema file: {schema_file}"
        with open(schema_file, "r", encoding="utf-8") as f:
            schema = json.load(f)

        column_names = [c["name"] for c in schema]
        assert "order_id" in column_names
        assert "customer_id" in column_names
        assert "amount" in column_names
        assert "created_at" in column_names
        assert "ingested_at" in column_names


def test_ddl_file_exists():
    """Verify DDL SQL file exists and contains CREATE TABLE statement."""
    ddl_path = "sql/ddl/cleaned_sales.sql"
    assert os.path.exists(ddl_path)
    with open(ddl_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "CREATE TABLE" in content
    assert "cleaned_sales" in content
    assert "PARTITION BY" in content


def test_transformation_cleaning():
    """Verify data cleaning, trimming, deduplication, and type casting."""
    if pd is None:
        pytest.skip("pandas not installed in current environment")

    from pipeline.run_sales_etl import PipelineRunner

    raw_data = {
        "order_id": ["1001", "1002", "1001", "1003", "INVALID"],
        "customer_id": [" CUST-201 ", "CUST-202", "CUST-201", "CUST-203", "CUST-204"],
        "customer_name": ["Alice Johnson", "Bob Smith", "Alice Johnson", "Carlos Rivera", "Diana Prince"],
        "customer_email": ["alice@example.com", "bob@example.com", "alice@example.com", "", "diana@example.com"],
        "product_category": ["Electronics", "Books", "Electronics", "Beauty", "Clothing"],
        "amount": ["$299.99", " 15.20 ", "$299.99", "1,200.50", "invalid"],
        "currency": ["USD", "USD", "USD", "USD", "USD"],
        "order_status": ["COMPLETED", "COMPLETED", "COMPLETED", "PENDING", "CANCELLED"],
        "created_at": [
            "2026-09-01T10:14:22Z",
            "2026-09-01T11:05:10Z",
            "2026-09-01T10:14:22Z",
            "2026-09-01T12:30:15Z",
            "2026-09-01T13:12:44Z",
        ],
    }
    df_raw = pd.DataFrame(raw_data)
    runner = PipelineRunner(execution_date="2026-09-01")
    df_transformed = runner.transform_dataframe(df_raw)

    # Verify deduplication of order_id 1001 and drop of invalid order_id
    assert len(df_transformed) == 3
    assert set(df_transformed["order_id"].tolist()) == {1001, 1002, 1003}

    # Verify whitespace trimming
    assert df_transformed.loc[df_transformed["order_id"] == 1001, "customer_id"].iloc[0] == "CUST-201"

    # Verify amount numeric cast
    assert df_transformed.loc[df_transformed["order_id"] == 1001, "amount"].iloc[0] == 299.99
    assert df_transformed.loc[df_transformed["order_id"] == 1003, "amount"].iloc[0] == 1200.50

    # Verify ingested_at exists
    assert "ingested_at" in df_transformed.columns


def test_transformation_empty():
    """Verify empty dataframe handling."""
    if pd is None:
        pytest.skip("pandas not installed in current environment")

    from pipeline.run_sales_etl import PipelineRunner

    runner = PipelineRunner()
    df_empty = pd.DataFrame()
    df_out = runner.transform_dataframe(df_empty)
    assert len(df_out) == 0


def test_app_entrypoint_ast():
    """Verify app.py has valid AST syntax."""
    app_path = "app.py"
    assert os.path.isfile(app_path)
    with open(app_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None
