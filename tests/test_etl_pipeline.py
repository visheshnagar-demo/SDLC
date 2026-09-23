"""Unit and Integration Tests for Sales ETL Pipeline."""
import pytest
from pipeline.validator import DataValidator
from pipeline.transformer import DataTransformer
from pipeline.deduplicator import RecordDeduplicator


def test_validator_valid_data():
    raw_data = [
        {
            "order_id": 1001,
            "customer_id": "CUST-201",
            "customer_name": "Alice Johnson ",
            "customer_email": "alice.j@example.com",
            "product_category": "Electronics",
            "amount": 299.99,
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-09-01T10:14:22Z",
        },
        {
            "order_id": 1002,
            "customer_id": "CUST-202",
            "customer_name": "Bob Smith",
            "customer_email": "bob@example.com",
            "product_category": "Books",
            "amount": 15.00,
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-09-01T11:00:00Z",
        },
    ]

    validator = DataValidator()
    valid_data, quarantined_data = validator.validate(raw_data)

    assert len(valid_data) == 2
    assert len(quarantined_data) == 0


def test_validator_circuit_breaker():
    invalid_data = [
        {
            "order_id": None,
            "customer_id": None,
            "customer_name": None,
            "customer_email": None,
            "product_category": None,
            "amount": None,
            "currency": None,
            "order_status": None,
            "created_at": None,
        }
    ]

    validator = DataValidator()
    with pytest.raises(ValueError, match="100% of raw records"):
        validator.validate(invalid_data)


def test_transformer_cleaning_and_derived_fields():
    raw_data = [
        {
            "order_id": "1001",
            "customer_id": " CUST-201 ",
            "customer_name": "Alice Johnson",
            "customer_email": "alice@example.com",
            "product_category": " Electronics ",
            "amount": "$299.99",
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-09-01T10:14:22Z",
        },
        {
            "order_id": "1002",
            "customer_id": "CUST-202",
            "customer_name": "Bob Smith",
            "customer_email": None,
            "product_category": "nan",
            "amount": "15.00",
            "currency": "USD",
            "order_status": "PENDING",
            "created_at": "2026-09-02T12:00:00Z",
        },
    ]

    transformer = DataTransformer()
    transformed_data = transformer.transform(raw_data)

    assert len(transformed_data) == 2
    first_row = transformed_data[0]
    second_row = transformed_data[1]

    assert first_row["customer_id"] == "CUST-201"
    assert first_row["product_category"] == "Electronics"
    assert first_row["amount"] == 299.99
    assert first_row["order_date"] == "2026-09-01"
    assert "ingestion_timestamp" in first_row

    # Check null normalization
    assert second_row["product_category"] is None
    assert second_row["customer_email"] is None


def test_deduplicator():
    data = [
        {
            "order_id": 1001,
            "customer_id": "CUST-201",
            "created_at": "2026-09-01T10:00:00Z",
            "amount": 100.0,
        },
        {
            "order_id": 1001,  # Duplicate
            "customer_id": "CUST-201",
            "created_at": "2026-09-01T11:00:00Z",  # Later record
            "amount": 120.0,
        },
        {
            "order_id": 1002,
            "customer_id": "CUST-202",
            "created_at": "2026-09-01T10:30:00Z",
            "amount": 50.0,
        },
    ]

    deduplicator = RecordDeduplicator(key_cols=["order_id"])
    clean_data, removed_count = deduplicator.deduplicate(data)

    assert len(clean_data) == 2
    assert removed_count == 1
    # Check that latest record was retained
    rec_1001 = [r for r in clean_data if r["order_id"] == 1001][0]
    assert rec_1001["amount"] == 120.0
