"""Unit tests for Sales Order Transformer."""

from datetime import datetime, timezone
from decimal import Decimal
import pytest
from server.transformer import SalesOrderTransformer, parse_timestamp


def test_parse_timestamp():
    dt = parse_timestamp("2026-05-18T14:30:00Z")
    assert dt.year == 2026
    assert dt.month == 5
    assert dt.day == 18
    assert dt.hour == 14
    assert dt.minute == 30


def test_transform_empty_list():
    transformer = SalesOrderTransformer(batch_id="test-batch-001")
    records, metrics, quarantined = transformer.transform([])

    assert len(records) == 0
    assert metrics.raw_records == 0
    assert metrics.clean_records_to_load == 0
    assert len(quarantined) == 0


def test_transform_valid_and_sanitized_record():
    raw_data = [
        {
            "order_id": "  ORD-1001  ",
            "customer_id": " CUST-501 ",
            "product_id": "PROD-A ",
            "product_category": " Electronics ",
            "quantity": " 3 ",
            "unit_price": " 12.50 ",
            "total_amount": " 37.50 ",
            "order_status": " completed ",
            "created_at": "2026-05-18T12:00:00Z",
        }
    ]
    transformer = SalesOrderTransformer(batch_id="test-batch-002")
    records, metrics, quarantined = transformer.transform(raw_data)

    assert len(records) == 1
    assert len(quarantined) == 0
    record = records[0]

    assert record.order_id == "ORD-1001"
    assert record.customer_id == "CUST-501"
    assert record.product_id == "PROD-A"
    assert record.product_category == "Electronics"
    assert record.quantity == 3
    assert record.unit_price == Decimal("12.50")
    assert record.total_amount == Decimal("37.50")
    assert record.order_status == "COMPLETED"
    assert record.batch_id == "test-batch-002"
    assert metrics.clean_records_to_load == 1


def test_transform_recalculates_inconsistent_total():
    raw_data = [
        {
            "order_id": "ORD-1002",
            "customer_id": "CUST-502",
            "product_id": "PROD-B",
            "product_category": "Books",
            "quantity": "2",
            "unit_price": "10.00",
            "total_amount": "999.00",  # Inconsistent
            "order_status": "COMPLETED",
            "created_at": "2026-05-18T13:00:00Z",
        }
    ]
    transformer = SalesOrderTransformer(batch_id="test-batch-003")
    records, metrics, quarantined = transformer.transform(raw_data)

    assert len(records) == 1
    assert records[0].total_amount == Decimal("20.00")


def test_transform_quarantines_invalid_records():
    raw_data = [
        # Invalid quantity (<= 0)
        {
            "order_id": "ORD-INVALID-1",
            "customer_id": "CUST-1",
            "product_id": "PROD-1",
            "product_category": "Apparel",
            "quantity": "0",
            "unit_price": "15.00",
            "total_amount": "0.00",
            "order_status": "COMPLETED",
            "created_at": "2026-05-18T10:00:00Z",
        },
        # Negative unit price
        {
            "order_id": "ORD-INVALID-2",
            "customer_id": "CUST-2",
            "product_id": "PROD-2",
            "product_category": "Apparel",
            "quantity": "1",
            "unit_price": "-5.00",
            "total_amount": "-5.00",
            "order_status": "COMPLETED",
            "created_at": "2026-05-18T10:00:00Z",
        },
        # Missing required field order_id
        {
            "order_id": "",
            "customer_id": "CUST-3",
            "product_id": "PROD-3",
            "product_category": "Apparel",
            "quantity": "1",
            "unit_price": "5.00",
            "total_amount": "5.00",
            "order_status": "COMPLETED",
            "created_at": "2026-05-18T10:00:00Z",
        },
        # Valid record
        {
            "order_id": "ORD-VALID-1",
            "customer_id": "CUST-4",
            "product_id": "PROD-4",
            "product_category": "Apparel",
            "quantity": "1",
            "unit_price": "25.00",
            "total_amount": "25.00",
            "order_status": "COMPLETED",
            "created_at": "2026-05-18T10:00:00Z",
        },
    ]
    transformer = SalesOrderTransformer(batch_id="test-batch-004")
    records, metrics, quarantined = transformer.transform(raw_data)

    assert len(records) == 1
    assert len(quarantined) == 3
    assert metrics.raw_records == 4
    assert metrics.quarantined_records == 3
    assert metrics.clean_records_to_load == 1
    assert records[0].order_id == "ORD-VALID-1"


def test_transform_deduplication_preserves_latest():
    raw_data = [
        # Older record for ORD-DUP-1
        {
            "order_id": "ORD-DUP-1",
            "customer_id": "CUST-1",
            "product_id": "PROD-OLD",
            "product_category": "Home",
            "quantity": "1",
            "unit_price": "10.00",
            "total_amount": "10.00",
            "order_status": "PENDING",
            "created_at": "2026-05-18T08:00:00Z",
        },
        # Newer record for ORD-DUP-1 (should be kept)
        {
            "order_id": "ORD-DUP-1",
            "customer_id": "CUST-1",
            "product_id": "PROD-NEW",
            "product_category": "Home",
            "quantity": "2",
            "unit_price": "10.00",
            "total_amount": "20.00",
            "order_status": "COMPLETED",
            "created_at": "2026-05-18T16:00:00Z",
        },
        # Unique record
        {
            "order_id": "ORD-UNIQ-2",
            "customer_id": "CUST-2",
            "product_id": "PROD-UNIQ",
            "product_category": "Home",
            "quantity": "1",
            "unit_price": "50.00",
            "total_amount": "50.00",
            "order_status": "COMPLETED",
            "created_at": "2026-05-18T12:00:00Z",
        },
    ]
    transformer = SalesOrderTransformer(batch_id="test-batch-005")
    records, metrics, quarantined = transformer.transform(raw_data)

    assert len(records) == 2
    assert metrics.deduplicated_records == 1
    assert metrics.clean_records_to_load == 2

    # Check that the newer record for ORD-DUP-1 was preserved
    dup_record = next(r for r in records if r.order_id == "ORD-DUP-1")
    assert dup_record.product_id == "PROD-NEW"
    assert dup_record.quantity == 2
    assert dup_record.order_status == "COMPLETED"
