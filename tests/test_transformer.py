"""Unit tests for the Data Cleaning, Validation, and Deduplication Transformer."""

import pandas as pd
from server.transformer import Transformer


def test_transformer_empty_dataframe():
    """Verify transformer handles empty input cleanly."""
    transformer = Transformer(batch_id="test-batch-1")
    df_clean, metrics = transformer.transform(pd.DataFrame(), batch_id="test-batch-1")

    assert df_clean.empty
    assert metrics.raw_records == 0
    assert metrics.clean_records_to_load == 0
    assert metrics.quarantined_records == 0
    assert metrics.deduplicated_records == 0


def test_transformer_whitespace_cleaning_and_types():
    """AC: Data Cleaning & Deduplication - Clean whitespace and cast types."""
    raw_data = {
        "order_id": ["  ORD-101  ", "ORD-102"],
        "customer_id": ["  CUST-1  ", "CUST-2"],
        "product_id": [" PROD-A ", "PROD-B"],
        "product_category": [" Electronics ", None],
        "quantity": [" 3 ", 2],
        "unit_price": [" 19.99 ", 50.0],
        "total_amount": [None, 100.0],
        "order_status": [" completed ", "SHIPPED"],
        "created_at": ["2026-05-18 10:30:00", "2026-05-18T11:00:00Z"],
    }
    df_raw = pd.DataFrame(raw_data)
    transformer = Transformer(batch_id="test-batch-2")
    df_clean, metrics = transformer.transform(df_raw, batch_id="test-batch-2")

    assert metrics.raw_records == 2
    assert metrics.clean_records_to_load == 2
    assert metrics.quarantined_records == 0
    assert metrics.deduplicated_records == 0

    assert df_clean.iloc[0]["order_id"] == "ORD-101"
    assert df_clean.iloc[0]["customer_id"] == "CUST-1"
    assert df_clean.iloc[0]["product_id"] == "PROD-A"
    assert df_clean.iloc[0]["product_category"] == "Electronics"
    assert df_clean.iloc[0]["quantity"] == 3
    assert df_clean.iloc[0]["unit_price"] == 19.99
    assert df_clean.iloc[0]["total_amount"] == 59.97  # Calculated 3 * 19.99
    assert df_clean.iloc[0]["batch_id"] == "test-batch-2"
    assert pd.notna(df_clean.iloc[0]["ingested_at"])


def test_transformer_deduplication():
    """AC: Data Cleaning & Deduplication - Retain a single valid record per order_id."""
    raw_data = {
        "order_id": ["ORD-200", "ORD-200", "ORD-201"],
        "customer_id": ["CUST-1", "CUST-1", "CUST-2"],
        "product_id": ["PROD-1", "PROD-1", "PROD-2"],
        "quantity": [1, 1, 4],
        "unit_price": [10.0, 10.0, 25.0],
        "created_at": [
            "2026-05-18T10:00:00Z",
            "2026-05-18T10:05:00Z",
            "2026-05-18T11:00:00Z",
        ],
    }
    df_raw = pd.DataFrame(raw_data)
    transformer = Transformer(batch_id="test-batch-3")
    df_clean, metrics = transformer.transform(df_raw, batch_id="test-batch-3")

    assert metrics.raw_records == 3
    assert metrics.deduplicated_records == 1
    assert metrics.clean_records_to_load == 2
    assert len(df_clean) == 2
    assert list(df_clean["order_id"]) == ["ORD-200", "ORD-201"]


def test_transformer_quarantines_corrupt_records():
    """AC: Data Cleaning & Deduplication - Quarantine corrupt/invalid rows."""
    raw_data = {
        "order_id": ["ORD-301", "", "ORD-303", "ORD-304", "ORD-305"],
        "customer_id": ["CUST-1", "CUST-2", "CUST-3", "CUST-4", "CUST-5"],
        "product_id": ["PROD-1", "PROD-2", "PROD-3", "PROD-4", "PROD-5"],
        "quantity": [2, 1, -5, 3, 2],  # ORD-303 has negative quantity
        "unit_price": [10.0, 20.0, 15.0, -10.0, 30.0],  # ORD-304 has negative price
        "created_at": [
            "2026-05-18T10:00:00Z",
            "2026-05-18T10:00:00Z",
            "2026-05-18T10:00:00Z",
            "2026-05-18T10:00:00Z",
            "invalid-timestamp-string",  # ORD-305 has invalid timestamp
        ],
    }
    df_raw = pd.DataFrame(raw_data)
    transformer = Transformer(batch_id="test-batch-4")
    df_clean, metrics = transformer.transform(df_raw, batch_id="test-batch-4")

    # Only ORD-301 is valid:
    # row 2: empty order_id
    # row 3: negative quantity (-5)
    # row 4: negative price (-10.0)
    # row 5: invalid timestamp
    assert metrics.raw_records == 5
    assert metrics.quarantined_records == 4
    assert metrics.clean_records_to_load == 1
    assert len(df_clean) == 1
    assert df_clean.iloc[0]["order_id"] == "ORD-301"
