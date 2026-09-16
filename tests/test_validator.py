import pytest
from server.pipeline.validator import (
    validate_email,
    validate_amount,
    validate_record,
    validate_sales_records,
)


@pytest.mark.parametrize(
    "email,expected",
    [
        ("user@example.com", True),
        ("first.last@company.org", True),
        ("customer+orders@sub.domain.co.uk", True),
        ("sales_123@domain-name.io", True),
        ("", False),
        ("   ", False),
        (None, False),
        ("invalid-email", False),
        ("missing_at.com", False),
        ("@missing-user.com", False),
        ("user@", False),
        ("user@domain", False),
        ("user@domain.", False),
        ("user@.com", False),
        ("user@domain..com", False),
        ("user name@domain.com", False),
    ],
)
def test_validate_email(email, expected):
    assert validate_email(email) is expected


@pytest.mark.parametrize(
    "amount,expected",
    [
        (100, True),
        (10.50, True),
        (0.01, True),
        ("25.99", True),
        (0, False),
        (-5.0, False),
        (None, False),
        ("", False),
        ("abc", False),
        (float("nan"), False),
        (float("inf"), False),
    ],
)
def test_validate_amount(amount, expected):
    assert validate_amount(amount) is expected


def test_validate_record_valid():
    record = {
        "order_id": "ord-001",
        "customer_email": "alice@example.com",
        "amount": 150.00,
        "order_date": "2026-05-18",
    }
    is_valid, reason = validate_record(record)
    assert is_valid is True
    assert reason is None


def test_validate_record_missing_amount():
    record = {
        "order_id": "ord-002",
        "customer_email": "bob@example.com",
        "amount": None,
        "order_date": "2026-05-18",
    }
    is_valid, reason = validate_record(record)
    assert is_valid is False
    assert reason == "MISSING_OR_NULL_AMOUNT"


def test_validate_record_invalid_email():
    record = {
        "order_id": "ord-003",
        "customer_email": "invalid_email_format",
        "amount": 200.00,
        "order_date": "2026-05-18",
    }
    is_valid, reason = validate_record(record)
    assert is_valid is False
    assert reason == "INVALID_EMAIL_FORMAT"


def test_validate_sales_records_batch():
    batch = [
        {"order_id": "1", "customer_email": "valid1@test.com", "amount": 100.0},
        {"order_id": "2", "customer_email": "valid2@test.com", "amount": None},
        {"order_id": "3", "customer_email": "invalid@", "amount": 50.0},
        {"order_id": "4", "customer_email": "valid3@test.com", "amount": -10.0},
        {"order_id": "5", "customer_email": "valid4@test.com", "amount": 75.25},
    ]

    valid, filtered, metrics = validate_sales_records(batch)

    assert len(valid) == 2
    assert len(filtered) == 3
    assert metrics["extracted_count"] == 5
    assert metrics["filtered_missing_amount"] == 2
    assert metrics["filtered_invalid_email"] == 1
    assert metrics["total_filtered"] == 3
    assert metrics["loaded_count"] == 2
