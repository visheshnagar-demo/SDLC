import pytest
from server.pipeline.validator import DataValidator


def test_validator_valid_record():
    record = {
        "order_id": "ord_001",
        "customer_id": "cust_100",
        "customer_email": "john.doe@example.com",
        "order_date": "2026-05-18",
        "amount": 150.50,
        "currency": "USD",
        "status": "completed"
    }
    is_valid, reason = DataValidator.validate_record(record)
    assert is_valid is True
    assert reason == ""


def test_validator_missing_or_null_amount():
    # Null amount
    record_null = {
        "order_id": "ord_002",
        "customer_id": "cust_101",
        "customer_email": "jane@example.com",
        "order_date": "2026-05-18",
        "amount": None
    }
    is_valid, reason = DataValidator.validate_record(record_null)
    assert is_valid is False
    assert reason == "MISSING_OR_NULL_AMOUNT"

    # Zero amount
    record_zero = {
        "order_id": "ord_003",
        "customer_email": "jane@example.com",
        "amount": 0.0
    }
    is_valid, reason = DataValidator.validate_record(record_zero)
    assert is_valid is False
    assert reason == "MISSING_OR_NULL_AMOUNT"

    # Negative amount
    record_neg = {
        "order_id": "ord_004",
        "customer_email": "jane@example.com",
        "amount": -50.0
    }
    is_valid, reason = DataValidator.validate_record(record_neg)
    assert is_valid is False
    assert reason == "MISSING_OR_NULL_AMOUNT"


def test_validator_invalid_email():
    invalid_emails = [
        "plainaddress",
        "@missingusername.com",
        "user@",
        "user@domain@domain.com",
        "user name@domain.com",
        None,
        ""
    ]
    for email in invalid_emails:
        record = {
            "order_id": "ord_inv_email",
            "customer_email": email,
            "amount": 99.99
        }
        is_valid, reason = DataValidator.validate_record(record)
        assert is_valid is False
        assert reason == "INVALID_EMAIL_FORMAT"


def test_validator_batch_processing():
    records = [
        {"order_id": "1", "customer_email": "a@b.com", "amount": 10.0},
        {"order_id": "2", "customer_email": "invalid_email", "amount": 20.0},
        {"order_id": "3", "customer_email": "c@d.com", "amount": None},
        {"order_id": "4", "customer_email": "d@e.com", "amount": -5.0},
        {"order_id": "5", "customer_email": "e@f.com", "amount": 55.25},
    ]

    valid, metrics, quarantined = DataValidator.validate_batch(records)

    assert len(valid) == 2
    assert metrics["extracted_count"] == 5
    assert metrics["filtered_missing_amount"] == 2
    assert metrics["filtered_invalid_email"] == 1
    assert metrics["total_filtered"] == 3
    assert metrics["valid_count"] == 2
    assert len(quarantined) == 3
