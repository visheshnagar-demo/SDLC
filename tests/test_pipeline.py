"""Unit and integration tests for Sales Order ETL pipeline."""
import os
import ast
import pytest

from pipeline.cleaner import clean_sales_data
from pipeline.deduplicator import deduplicate_sales_data

def test_ast_syntax():
    """Verify AST parsing for pipeline Python files."""
    files_to_check = [
        "pipeline/run_sales_etl.py",
        "pipeline/ingest.py",
        "pipeline/cleaner.py",
        "pipeline/deduplicator.py",
        "pipeline/loader.py",
        "app.py"
    ]
    for filepath in files_to_check:
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                code = f.read()
            tree = ast.parse(code)
            assert tree is not None, f"Failed to parse AST for {filepath}"

def test_clean_sales_data():
    """Test data cleaning and normalization logic."""
    pd = pytest.importorskip("pandas")
    raw_data = pd.DataFrame([
        {
            "ORDER_ID": " 1001 ",
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
            "ORDER_ID": "1002",
            "customer_id": "CUST-202",
            "customer_name": "Bob Smith",
            "customer_email": None,
            "product_category": None,
            "amount": "invalid_amount",
            "currency": "USD",
            "order_status": "PENDING",
            "created_at": "2026-09-01T11:05:10Z"
        }
    ])

    cleaned = clean_sales_data(raw_data)
    assert len(cleaned) == 2
    assert cleaned.iloc[0]["order_id"] == "1001"
    assert cleaned.iloc[0]["amount"] == 299.99
    assert str(cleaned.iloc[0]["order_date"]) == "2026-09-01"

    # Verify null handling using pd.isna
    assert pd.isna(cleaned.iloc[1]["amount"])
    assert pd.isna(cleaned.iloc[1]["customer_email"])

def test_deduplicate_sales_data():
    """Test deduplication logic keeping the latest record."""
    pd = pytest.importorskip("pandas")
    data = pd.DataFrame([
        {
            "order_id": "1001",
            "customer_name": "Alice Johnson",
            "created_at": "2026-09-01T10:14:22Z"
        },
        {
            "order_id": "1001",
            "customer_name": "Alice Johnson Updated",
            "created_at": "2026-09-01T12:00:00Z"
        }
    ])
    deduped = deduplicate_sales_data(data)
    assert len(deduped) == 1
    assert deduped.iloc[0]["customer_name"] == "Alice Johnson Updated"

