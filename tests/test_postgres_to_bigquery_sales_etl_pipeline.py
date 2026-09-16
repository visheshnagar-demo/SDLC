"""Automated tests for pipeline postgres_to_bigquery_sales_etl."""
import ast
import os
import pytest
from datetime import datetime, date

from pipeline.run_postgres_to_bigquery_sales_etl import (
    SalesDataCleanser,
    QuarantineManager,
    PostgresExtractor,
    BigQueryLoader,
    PipelineRunner,
)


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "postgres_to_bigquery_sales_etl_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_postgres_to_bigquery_sales_etl.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_email_validation_logic():
    """Tests RFC-compliant email validation rules."""
    assert SalesDataCleanser.is_valid_email("alice@example.com") is True
    assert SalesDataCleanser.is_valid_email("user.name+tag@sub.domain.co.uk") is True
    assert SalesDataCleanser.is_valid_email("john.doe@company.org") is True

    assert SalesDataCleanser.is_valid_email("") is False
    assert SalesDataCleanser.is_valid_email(None) is False
    assert SalesDataCleanser.is_valid_email("invalid-email") is False
    assert SalesDataCleanser.is_valid_email("user@") is False
    assert SalesDataCleanser.is_valid_email("@domain.com") is False
    assert SalesDataCleanser.is_valid_email("user@domain") is False
    assert SalesDataCleanser.is_valid_email("user @domain.com") is False


def test_amount_validation_logic():
    """Tests monetary amount validation rules (must be non-null and > 0)."""
    assert SalesDataCleanser.is_valid_amount(100.50) is True
    assert SalesDataCleanser.is_valid_amount("250.00") is True
    assert SalesDataCleanser.is_valid_amount(0.01) is True

    assert SalesDataCleanser.is_valid_amount(None) is False
    assert SalesDataCleanser.is_valid_amount(0) is False
    assert SalesDataCleanser.is_valid_amount(-15.50) is False
    assert SalesDataCleanser.is_valid_amount("invalid_amount") is False
    assert SalesDataCleanser.is_valid_amount(float("nan")) is False


def test_cleansing_and_quarantine_pipeline():
    """Tests the cleansing transformation filtering and dead-letter quarantine mechanism."""
    quarantine_manager = QuarantineManager()
    cleanser = SalesDataCleanser(quarantine_manager=quarantine_manager)

    raw_records = [
        # Valid row 1
        {
            "order_id": "ORD-001",
            "customer_id": "CUST-101",
            "customer_name": "Alice Smith",
            "customer_email": "alice@example.com",
            "order_date": "2026-09-15",
            "amount": 150.00,
            "currency": "USD",
            "status": "COMPLETED",
        },
        # Invalid row: Missing amount (None)
        {
            "order_id": "ORD-002",
            "customer_id": "CUST-102",
            "customer_name": "Bob Jones",
            "customer_email": "bob@example.com",
            "order_date": "2026-09-15",
            "amount": None,
            "currency": "USD",
            "status": "PENDING",
        },
        # Invalid row: Invalid email format
        {
            "order_id": "ORD-003",
            "customer_id": "CUST-103",
            "customer_name": "Charlie Brown",
            "customer_email": "charlie-no-at-sign",
            "order_date": "2026-09-15",
            "amount": 200.00,
            "currency": "USD",
            "status": "COMPLETED",
        },
        # Invalid row: Zero amount
        {
            "order_id": "ORD-004",
            "customer_id": "CUST-104",
            "customer_name": "Diana Prince",
            "customer_email": "diana@themyscira.com",
            "order_date": "2026-09-16",
            "amount": 0.0,
            "currency": "USD",
            "status": "COMPLETED",
        },
        # Valid row 2
        {
            "order_id": "ORD-005",
            "customer_id": "CUST-105",
            "customer_name": "Evan Wright",
            "customer_email": "evan@example.org",
            "order_date": "2026-09-16",
            "amount": 89.99,
            "currency": "EUR",
            "status": "SHIPPED",
        },
    ]

    clean_records = cleanser.clean_records(raw_records)

    # Valid records count should be 2 (ORD-001 and ORD-005)
    assert len(clean_records) == 2
    if isinstance(clean_records, list):
        order_ids = [r["order_id"] for r in clean_records]
        assert order_ids == ["ORD-001", "ORD-005"]
        for row in clean_records:
            assert isinstance(row["order_date"], (date, datetime))
            assert row["amount"] > 0
            assert "@" in row["customer_email"]
            assert "loaded_at" in row
    else:
        assert list(clean_records["order_id"]) == ["ORD-001", "ORD-005"]

    # Quarantined count should be 3 (ORD-002, ORD-003, ORD-004)
    assert quarantine_manager.total_quarantined == 3
    assert quarantine_manager.reason_counts["ERR_MISSING_OR_INVALID_AMOUNT"] == 2  # None and 0.0
    assert quarantine_manager.reason_counts["ERR_INVALID_EMAIL_FORMAT"] == 1       # charlie-no-at-sign


def test_zero_mock_policy_extractor():
    """Verifies that the extractor fails fast if database credentials are not configured."""
    extractor = PostgresExtractor(table_name="raw_sales_orders")
    # Temporarily ensure environment variables are unset
    orig_db_url = os.environ.pop("DATABASE_URL", None)
    orig_pg_url = os.environ.pop("POSTGRES_URL", None)
    orig_pg_db_url = os.environ.pop("POSTGRES_DB_URL", None)
    orig_host = os.environ.pop("POSTGRES_HOST", None)

    try:
        with pytest.raises(EnvironmentError) as exc_info:
            extractor.get_connection_url()
        assert "must be configured" in str(exc_info.value)
    finally:
        if orig_db_url:
            os.environ["DATABASE_URL"] = orig_db_url
        if orig_pg_url:
            os.environ["POSTGRES_URL"] = orig_pg_url
        if orig_pg_db_url:
            os.environ["POSTGRES_DB_URL"] = orig_pg_db_url
        if orig_host:
            os.environ["POSTGRES_HOST"] = orig_host
