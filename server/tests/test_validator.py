import pytest
from datetime import date
from server.models import RawSalesOrder
from server.services.validator import DataValidationEngine


@pytest.fixture
def validator():
    return DataValidationEngine()


def test_is_valid_email_valid_cases(validator):
    valid_emails = [
        "user@example.com",
        "john.doe@company.org",
        "first+last@subdomain.domain.co.uk",
        "customer_123@domain.io",
        "a.b.c@test-domain.com",
    ]
    for email in valid_emails:
        assert validator.is_valid_email(email) is True, (
            f"Failed for valid email: {email}"
        )


def test_is_valid_email_invalid_cases(validator):
    invalid_emails = [
        None,
        "",
        "   ",
        "plainaddress",
        "@missingusername.com",
        "username@.com",
        "username@domain",
        "username@domain..com",
        "user name@domain.com",
        12345,
    ]
    for email in invalid_emails:
        assert validator.is_valid_email(email) is False, (
            f"Failed to reject invalid email: {email}"
        )


def test_is_valid_amount_valid_cases(validator):
    valid_amounts = [
        100.0,
        0.0,
        0,
        1500,
        "49.99",
        "0",
        999999.99,
    ]
    for amount in valid_amounts:
        assert validator.is_valid_amount(amount) is True, (
            f"Failed for valid amount: {amount}"
        )


def test_is_valid_amount_invalid_cases(validator):
    invalid_amounts = [
        None,
        -10.0,
        "-50",
        "invalid_amount",
        "",
        float("nan"),
        float("inf"),
        float("-inf"),
    ]
    for amount in invalid_amounts:
        assert validator.is_valid_amount(amount) is False, (
            f"Failed to reject invalid amount: {amount}"
        )


def test_validate_record_success(validator):
    order = RawSalesOrder(
        order_id="TEST-1",
        customer_id="CUST-1",
        customer_email="  buyer@shop.com  ",
        order_date=date(2026, 5, 10),
        amount=199.95,
        currency="USD",
        status="COMPLETED",
    )
    is_valid, reason, clean_order = validator.validate_record(order)
    assert is_valid is True
    assert reason is None
    assert clean_order is not None
    assert clean_order.order_id == "TEST-1"
    assert clean_order.customer_email == "buyer@shop.com"
    assert clean_order.amount == 199.95


def test_validate_record_missing_amount(validator):
    order = RawSalesOrder(
        order_id="TEST-2",
        customer_id="CUST-2",
        customer_email="buyer@shop.com",
        order_date=date(2026, 5, 10),
        amount=None,
    )
    is_valid, reason, clean_order = validator.validate_record(order)
    assert is_valid is False
    assert reason == "MISSING_OR_INVALID_AMOUNT"
    assert clean_order is None


def test_validate_record_invalid_email(validator):
    order = RawSalesOrder(
        order_id="TEST-3",
        customer_id="CUST-3",
        customer_email="invalid_email",
        order_date=date(2026, 5, 10),
        amount=50.0,
    )
    is_valid, reason, clean_order = validator.validate_record(order)
    assert is_valid is False
    assert reason == "INVALID_EMAIL_FORMAT"
    assert clean_order is None


def test_process_batch(validator):
    orders = [
        RawSalesOrder(
            order_id="V1",
            customer_email="v1@ok.com",
            order_date=date(2026, 5, 1),
            amount=10.0,
        ),
        RawSalesOrder(
            order_id="V2",
            customer_email="v2@ok.com",
            order_date=date(2026, 5, 1),
            amount=20.0,
        ),
        RawSalesOrder(
            order_id="I1",
            customer_email="bad-email",
            order_date=date(2026, 5, 1),
            amount=30.0,
        ),
        RawSalesOrder(
            order_id="I2",
            customer_email="v3@ok.com",
            order_date=date(2026, 5, 1),
            amount=None,
        ),
    ]
    valid_records, quarantined, breakdown = validator.process_batch(orders)

    assert len(valid_records) == 2
    assert len(quarantined) == 2
    assert breakdown["missing_amount"] == 1
    assert breakdown["invalid_email"] == 1
