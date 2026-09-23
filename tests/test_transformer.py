"""Unit tests for data transformer."""
import pytest

pd = pytest.importorskip("pandas")
from pipeline.transformer import DataTransformer


def test_transformer_cleaning_and_types():
    raw_data = {
        "order_id": [" 1001 ", "1002", "1003"],
        "customer_id": [" CUST-1 ", "CUST-2", "CUST-3"],
        "customer_name": [" Alice  ", " Bob ", "Carlos"],
        "customer_email": ["alice@example.com ", "nan", "NULL"],
        "product_category": [" Electronics ", "None", ""],
        "amount": [" $299.99 ", "49.50", "invalid"],
        "currency": [" USD ", "USD", "EUR"],
        "order_status": [" COMPLETED ", "PENDING", "CANCELLED"],
        "created_at": [
            "2026-09-01T10:14:22Z",
            "2026-09-01 11:05:10",
            "2026-09-01T12:00:00Z",
        ],
    }
    df_raw = pd.DataFrame(raw_data)
    transformer = DataTransformer()
    df_clean = transformer.transform(df_raw)

    assert len(df_clean) == 3
    # Check string whitespace trimming
    assert df_clean["customer_name"].iloc[0] == "Alice"
    assert df_clean["customer_id"].iloc[0] == "CUST-1"
    assert df_clean["currency"].iloc[0] == "USD"
    assert df_clean["order_status"].iloc[0] == "COMPLETED"

    # Check null conversion
    assert df_clean["customer_email"].iloc[1] is None
    assert df_clean["customer_email"].iloc[2] is None
    assert df_clean["product_category"].iloc[1] is None
    assert df_clean["product_category"].iloc[2] is None

    # Check types
    assert df_clean["order_id"].iloc[0] == 1001
    assert df_clean["amount"].iloc[0] == 299.99
    assert df_clean["amount"].iloc[1] == 49.50
    assert pd.isna(df_clean["amount"].iloc[2])

    # Check timestamps
    assert pd.api.types.is_datetime64_any_dtype(df_clean["created_at"])
    assert "ingested_at" in df_clean.columns
    assert pd.api.types.is_datetime64_any_dtype(df_clean["ingested_at"])
