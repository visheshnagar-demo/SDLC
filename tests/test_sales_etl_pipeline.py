"""Pipeline integration tests for sales_etl pipeline."""
import pytest
from pipeline.transformer import DataTransformer
from pipeline.deduplicator import RecordDeduplicator
from pipeline.validator import DataValidator


def test_end_to_end_transformation_flow():
    sample_raw = [
        {
            "order_id": 1001,
            "customer_id": "CUST-201",
            "customer_name": "Alice Johnson",
            "customer_email": "alice@example.com",
            "product_category": "Electronics",
            "amount": 299.99,
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-09-01T10:14:22Z",
        },
        {
            "order_id": 1001,  # Duplicate
            "customer_id": "CUST-201",
            "customer_name": "Alice Johnson",
            "customer_email": "alice@example.com",
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
            "customer_email": None,
            "product_category": "Books",
            "amount": 49.50,
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-09-01T11:05:10Z",
        },
    ]

    validator = DataValidator()
    valid_data, quarantined_data = validator.validate(sample_raw)
    assert len(valid_data) == 3

    transformer = DataTransformer()
    transformed_data = transformer.transform(valid_data)
    assert len(transformed_data) == 3
    assert "order_date" in transformed_data[0]
    assert "ingestion_timestamp" in transformed_data[0]

    deduplicator = RecordDeduplicator(key_cols=["order_id"])
    final_data, removed_count = deduplicator.deduplicate(transformed_data)

    assert len(final_data) == 2
    assert removed_count == 1
    # Check null email
    bob_rec = [r for r in final_data if r["order_id"] == 1002][0]
    assert bob_rec["customer_email"] is None
