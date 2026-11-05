import pandas as pd
from datetime import datetime, timezone
from server.transformer import clean_string_field, parse_datetime_field, transform_sales_data


def test_clean_string_field():
    assert clean_string_field("  ORD-123  ") == "ORD-123"
    assert clean_string_field("") is None
    assert clean_string_field("   ") is None
    assert clean_string_field(None) is None
    assert clean_string_field(float("nan")) is None


def test_parse_datetime_field():
    dt = parse_datetime_field("2026-05-18T12:00:00Z")
    assert dt is not None
    assert dt.year == 2026
    assert dt.month == 5
    assert dt.day == 18
    assert parse_datetime_field("invalid-date") is None
    assert parse_datetime_field(None) is None


def test_transform_sales_data_clean_and_deduplicate():
    raw_data = {
        "order_id": [" ORD-1 ", "ORD-2", "ORD-1", "ORD-3 "],
        "customer_id": ["CUST-1", "CUST-2", "CUST-1", "CUST-3"],
        "product_id": ["PROD-A", "PROD-B", "PROD-A", "PROD-C"],
        "product_category": ["Electronics", "Books", "Electronics", None],
        "quantity": [2, 1, 2, 4],
        "unit_price": [50.0, 15.5, 50.0, 10.0],
        "total_amount": [100.0, 15.5, 100.0, 40.0],
        "order_status": ["COMPLETED", "PENDING", "COMPLETED", "COMPLETED"],
        "created_at": [
            "2026-05-18T08:00:00Z",
            "2026-05-18T09:00:00Z",
            "2026-05-18T10:00:00Z",
            "2026-05-18T11:00:00Z",
        ],
    }
    raw_df = pd.DataFrame(raw_data)

    clean_df, quarantined_df, metrics = transform_sales_data(raw_df, batch_id="batch-123")

    assert metrics.raw_records == 4
    assert metrics.quarantined_records == 0
    assert metrics.deduplicated_records == 1  # ORD-1 duplicated
    assert metrics.clean_records_to_load == 3
    assert len(clean_df) == 3
    assert quarantined_df.empty

    # Verify trimmed values and columns
    order_ids = list(clean_df["order_id"])
    assert "ORD-1" in order_ids
    assert "ORD-2" in order_ids
    assert "ORD-3" in order_ids

    # Check batch_id and ingested_at
    assert all(clean_df["batch_id"] == "batch-123")
    assert all(clean_df["ingested_at"].notna())


def test_transform_sales_data_quarantine_invalid_rows():
    raw_data = {
        "order_id": ["ORD-VALID", "", "ORD-BAD-QTY", "ORD-BAD-PRICE", "ORD-BAD-DATE"],
        "customer_id": ["CUST-1", "CUST-2", "CUST-3", "CUST-4", "CUST-5"],
        "product_id": ["PROD-1", "PROD-2", "PROD-3", "PROD-4", "PROD-5"],
        "quantity": [1, 2, -5, 1, 1],
        "unit_price": [20.0, 10.0, 10.0, -9.99, 10.0],
        "created_at": [
            "2026-05-18T08:00:00Z",
            "2026-05-18T09:00:00Z",
            "2026-05-18T10:00:00Z",
            "2026-05-18T11:00:00Z",
            "not-a-date",
        ],
    }
    raw_df = pd.DataFrame(raw_data)

    clean_df, quarantined_df, metrics = transform_sales_data(raw_df, batch_id="test-batch")

    assert metrics.raw_records == 5
    assert metrics.quarantined_records == 4
    assert metrics.clean_records_to_load == 1
    assert len(clean_df) == 1
    assert len(quarantined_df) == 4
    assert clean_df.iloc[0]["order_id"] == "ORD-VALID"


def test_transform_sales_data_auto_total_calculation():
    raw_data = {
        "order_id": ["ORD-AUTO"],
        "customer_id": ["CUST-10"],
        "product_id": ["PROD-10"],
        "quantity": [3],
        "unit_price": [12.5],
        "total_amount": [None],
        "created_at": ["2026-05-18T14:00:00Z"],
    }
    raw_df = pd.DataFrame(raw_data)

    clean_df, _, metrics = transform_sales_data(raw_df)
    assert metrics.clean_records_to_load == 1
    assert clean_df.iloc[0]["total_amount"] == 37.5


def test_transform_sales_data_empty():
    clean_df, quarantined_df, metrics = transform_sales_data(pd.DataFrame())
    assert clean_df.empty
    assert quarantined_df.empty
    assert metrics.raw_records == 0
    assert metrics.clean_records_to_load == 0
