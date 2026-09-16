"""Comprehensive test suite for Sales Orders ETL Pipeline."""
from datetime import date, datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from server.database import init_db
from server.main import app
from server.models import Base, RawSalesOrderDB
from server.pipeline.cleanser import SalesDataCleanser
from server.pipeline.extractor import PostgresExtractor
from server.pipeline.loader import BigQueryLoader
from server.pipeline.main import ETLPipelineRunner
from server.pipeline.quarantine import QuarantineManager


@pytest.fixture
def sqlite_engine():
    """Create in-memory SQLite database and populate with test schema and data."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        conn.execute(
            text(
                """
                INSERT INTO raw_sales_orders (order_id, customer_id, customer_name, customer_email, order_date, amount, currency, status)
                VALUES 
                ('ORD-001', 'CUST-1', 'Alice Smith', 'alice@example.com', '2026-03-01', 150.50, 'USD', 'COMPLETED'),
                ('ORD-002', 'CUST-2', 'Bob Jones', 'invalid-email', '2026-03-01', 200.00, 'USD', 'COMPLETED'),
                ('ORD-003', 'CUST-3', 'Charlie Brown', 'charlie@example.com', '2026-03-02', NULL, 'USD', 'PENDING'),
                ('ORD-004', 'CUST-4', 'Diana Prince', 'diana@example.com', '2026-03-02', -50.00, 'USD', 'REFUNDED'),
                ('ORD-005', 'CUST-5', 'Evan Wright', 'evan.w@company.co.uk', '2026-03-03', 99.99, 'USD', 'COMPLETED')
                """
            )
        )
        conn.commit()
    return engine


@pytest.fixture
def cleanser():
    return SalesDataCleanser()


@pytest.fixture
def quarantine_manager():
    return QuarantineManager()


# ==========================================
# 1. Cleanser Unit Tests
# ==========================================

def test_cleanser_valid_record(cleanser):
    record = {
        "order_id": "ORD-100",
        "customer_id": "CUST-100",
        "customer_name": "Jane Doe",
        "customer_email": "jane.doe@example.com",
        "order_date": "2026-03-10",
        "amount": 250.75,
        "currency": "USD",
        "status": "COMPLETED",
    }
    clean, quarantine = cleanser.validate_record(record)
    assert quarantine is None
    assert clean is not None
    assert clean.order_id == "ORD-100"
    assert clean.customer_email == "jane.doe@example.com"
    assert clean.amount == 250.75
    assert clean.order_date == date(2026, 3, 10)
    assert clean.currency == "USD"
    assert clean.status == "COMPLETED"


def test_cleanser_missing_or_null_amount(cleanser):
    # Null amount
    clean, q1 = cleanser.validate_record({
        "order_id": "ORD-101",
        "customer_email": "valid@example.com",
        "order_date": "2026-03-10",
        "amount": None,
    })
    assert clean is None
    assert q1 is not None
    assert q1.error_code == "ERR_MISSING_OR_INVALID_AMOUNT"

    # Negative amount
    clean, q2 = cleanser.validate_record({
        "order_id": "ORD-102",
        "customer_email": "valid@example.com",
        "order_date": "2026-03-10",
        "amount": -25.0,
    })
    assert clean is None
    assert q2 is not None
    assert q2.error_code == "ERR_MISSING_OR_INVALID_AMOUNT"

    # Zero amount
    clean, q3 = cleanser.validate_record({
        "order_id": "ORD-103",
        "customer_email": "valid@example.com",
        "order_date": "2026-03-10",
        "amount": 0,
    })
    assert clean is None
    assert q3 is not None
    assert q3.error_code == "ERR_MISSING_OR_INVALID_AMOUNT"


def test_cleanser_invalid_email(cleanser):
    invalid_emails = ["notanemail", "missingat.com", "@domain.com", "user@", "user@.com", ""]
    for email in invalid_emails:
        clean, q = cleanser.validate_record({
            "order_id": "ORD-200",
            "customer_email": email,
            "order_date": "2026-03-10",
            "amount": 100.0,
        })
        assert clean is None
        assert q is not None
        assert q.error_code == "ERR_INVALID_EMAIL_FORMAT"


def test_cleanser_missing_order_id(cleanser):
    clean, q = cleanser.validate_record({
        "order_id": "",
        "customer_email": "user@example.com",
        "order_date": "2026-03-10",
        "amount": 100.0,
    })
    assert clean is None
    assert q is not None
    assert q.error_code == "ERR_MISSING_ORDER_ID"


def test_cleanser_invalid_order_date(cleanser):
    clean, q = cleanser.validate_record({
        "order_id": "ORD-300",
        "customer_email": "user@example.com",
        "order_date": "invalid-date-format",
        "amount": 100.0,
    })
    assert clean is None
    assert q is not None
    assert q.error_code == "ERR_INVALID_ORDER_DATE"


# ==========================================
# 2. Quarantine Manager Tests
# ==========================================

def test_quarantine_manager_metrics(quarantine_manager, cleanser):
    test_batch = [
        {"order_id": "O1", "customer_email": "valid@ex.com", "order_date": "2026-03-01", "amount": 100.0},
        {"order_id": "O2", "customer_email": "bademail", "order_date": "2026-03-01", "amount": 100.0},
        {"order_id": "O3", "customer_email": "valid@ex.com", "order_date": "2026-03-01", "amount": None},
        {"order_id": "", "customer_email": "valid@ex.com", "order_date": "2026-03-01", "amount": 100.0},
        {"order_id": "O5", "customer_email": "valid@ex.com", "order_date": "bad-date", "amount": 100.0},
    ]
    clean_records, quarantined = cleanser.process_batch(test_batch)
    quarantine_manager.record_batch(quarantined)

    metrics = quarantine_manager.compute_metrics(
        extracted_count=len(test_batch),
        valid_count=len(clean_records),
        loaded_count=len(clean_records),
    )

    assert metrics.records_extracted == 5
    assert metrics.records_valid == 1
    assert metrics.records_quarantined == 4
    assert metrics.filtered_invalid_email == 1
    assert metrics.filtered_missing_amount == 1
    assert metrics.filtered_missing_order_id == 1
    assert metrics.filtered_invalid_order_date == 1

    summary = quarantine_manager.get_summary_report()
    assert summary["total_quarantined"] == 4


# ==========================================
# 3. Extractor Tests
# ==========================================

def test_extractor_success(sqlite_engine):
    extractor = PostgresExtractor(engine=sqlite_engine)
    records = extractor.extract(table_name="raw_sales_orders")
    assert len(records) == 5
    assert records[0]["order_id"] == "ORD-001"
    assert "_extracted_at" in records[0]


def test_extractor_limit(sqlite_engine):
    extractor = PostgresExtractor(engine=sqlite_engine)
    records = extractor.extract(table_name="raw_sales_orders", batch_size=2)
    assert len(records) == 2


# ==========================================
# 4. BigQuery Loader Tests
# ==========================================

def test_loader_ensure_table_and_load(cleanser):
    mock_client = MagicMock()
    mock_client.project = "test-gcp-project"

    mock_load_job = MagicMock()
    mock_load_job.errors = None
    mock_load_job.job_id = "mock-job-12345"
    mock_client.load_table_from_json.return_value = mock_load_job

    loader = BigQueryLoader(
        project_id="test-gcp-project",
        dataset_id="dev_sales",
        table_id="fct_sales_orders_v1",
        client=mock_client,
    )

    records = [
        {"order_id": "ORD-01", "customer_email": "test1@ex.com", "order_date": "2026-03-01", "amount": 50.0},
        {"order_id": "ORD-02", "customer_email": "test2@ex.com", "order_date": "2026-03-02", "amount": 75.0},
    ]
    clean_records, _ = cleanser.process_batch(records)

    result = loader.load_records(clean_records)
    assert result["status"] == "SUCCESS"
    assert result["records_loaded"] == 2
    assert "2026-03-01" in result["affected_partitions"]
    assert "2026-03-02" in result["affected_partitions"]
    mock_client.load_table_from_json.assert_called_once()


# ==========================================
# 5. Pipeline Runner End-to-End Test
# ==========================================

def test_pipeline_runner_e2e(sqlite_engine):
    mock_client = MagicMock()
    mock_client.project = "test-project"
    mock_load_job = MagicMock()
    mock_load_job.errors = None
    mock_load_job.job_id = "job-e2e-001"
    mock_client.load_table_from_json.return_value = mock_load_job

    extractor = PostgresExtractor(engine=sqlite_engine)
    loader = BigQueryLoader(
        project_id="test-project",
        dataset_id="dev_sales",
        table_id="fct_sales_orders_v1",
        client=mock_client,
    )

    runner = ETLPipelineRunner(
        extractor=extractor,
        loader=loader,
    )

    result = runner.run(source_table="raw_sales_orders")

    assert result.status == "COMPLETED"
    assert result.metrics.records_extracted == 5
    # Out of 5: ORD-001 and ORD-005 are valid.
    # ORD-002 has bad email, ORD-003 has null amount, ORD-004 has negative amount.
    assert result.metrics.records_valid == 2
    assert result.metrics.records_quarantined == 3
    assert result.metrics.filtered_invalid_email == 1
    assert result.metrics.filtered_missing_amount == 2
    assert result.metrics.records_loaded == 2
    assert "2026-03-01" in result.target_partitions_affected
    assert "2026-03-03" in result.target_partitions_affected


# ==========================================
# 6. FastAPI Service Tests
# ==========================================

def test_fastapi_health():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_fastapi_pipeline_info():
    client = TestClient(app)
    response = client.get("/api/v1/pipeline/info")
    assert response.status_code == 200
    data = response.json()
    assert data["pipeline_name"] == "postgres_to_bigquery_sales_etl"
    assert data["source"]["table"] == "raw_sales_orders"
