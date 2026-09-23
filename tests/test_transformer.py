"""Unit tests for DataTransformer."""
import ast
import os
import pytest


def test_transformer_file_syntax():
    file_path = os.path.join("server", "transformer.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None


def test_transformer_cleansing_and_deduplication():
    pd = pytest.importorskip("pandas")
    from server.transformer import DataTransformer

    data = {
        "order_id": ["1001", "1001", "1002"],
        "customer_id": [" CUST-1 ", " CUST-1 ", "CUST-2"],
        "customer_name": [" Alice ", "Alice Johnson", "Bob"],
        "customer_email": [" ALICE@EXAMPLE.COM ", "alice@example.com", "bob@example.com"],
        "product_category": ["Electronics", "Electronics", "Books"],
        "amount": ["$299.99", "$350.00", " 15.20 "],
        "currency": ["usd", "USD", "usd"],
        "order_status": ["pending", "completed", "completed"],
        "created_at": [
            "2026-09-01T10:00:00Z",
            "2026-09-01T11:00:00Z",
            "2026-09-01T12:00:00Z",
        ],
    }
    df = pd.DataFrame(data)
    transformer = DataTransformer(batch_id="test-batch-123", source_uri="gs://test/data.csv")
    clean_df, dedup_removed = transformer.transform(df)

    assert dedup_removed == 1
    assert len(clean_df) == 2

    # Verify latest record for 1001 was retained (amount 350.00)
    order_1001 = clean_df[clean_df["order_id"] == 1001].iloc[0]
    assert order_1001["amount"] == 350.00
    assert order_1001["order_status"] == "COMPLETED"
    assert order_1001["currency"] == "USD"
    assert order_1001["customer_email"] == "alice@example.com"
    assert order_1001["_etl_batch_id"] == "test-batch-123"
    assert order_1001["_etl_source_file"] == "gs://test/data.csv"
    assert pd.notna(order_1001["_etl_ingested_at"])


def test_transformer_null_normalization():
    pd = pytest.importorskip("pandas")
    from server.transformer import DataTransformer

    data = {
        "order_id": ["2001"],
        "customer_id": ["CUST-9"],
        "customer_name": ["nan"],
        "customer_email": [""],
        "product_category": ["None"],
        "amount": [None],
        "currency": [None],
        "order_status": ["completed"],
        "created_at": ["2026-09-01T10:00:00Z"],
    }
    df = pd.DataFrame(data)
    transformer = DataTransformer(batch_id="test-batch-456", source_uri="gs://test/nulls.csv")
    clean_df, _ = transformer.transform(df)

    assert len(clean_df) == 1
    row = clean_df.iloc[0]
    assert pd.isna(row["customer_name"])
    assert pd.isna(row["customer_email"])
    assert pd.isna(row["product_category"])
    assert pd.isna(row["amount"])
    assert pd.isna(row["currency"])
