"""Unit and integration test suite for Sales Data ETL Pipeline."""
import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.api.etl_controller import execute_etl_job
from server.database import Base, get_db
from server.main import app
from server.models import (
    ETLJobLog,
    ETLJobRunRequest,
    QuarantineRecordModel,
    RawSalesOrder,
)
from server.services.bq_loader import BigQueryLoader
from server.services.dlq_service import DLQService
from server.services.pg_extractor import PostgreSQLExtractor
from server.services.sales_transformer import SalesTransformer

# In-memory test SQLite database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# ============================================================================
# Transformer Unit Tests
# ============================================================================

def test_sales_transformer_valid_record():
    raw_record = {
        "order_id": "ORD-001",
        "customer_email": "Customer@Example.com ",
        "amount": 250.75,
        "order_date": "2026-05-18",
    }
    cleaned, reasons = SalesTransformer.validate_and_transform_record(raw_record, "job-test-1")
    assert cleaned is not None
    assert len(reasons) == 0
    assert cleaned["order_id"] == "ORD-001"
    assert cleaned["customer_email"] == "customer@example.com"
    assert cleaned["amount"] == 250.75
    assert cleaned["order_date"] == "2026-05-18"
    assert cleaned["etl_job_id"] == "job-test-1"


def test_sales_transformer_missing_and_negative_amount():
    # Null amount
    raw_record_null = {
        "order_id": "ORD-002",
        "customer_email": "valid@example.com",
        "amount": None,
        "order_date": "2026-05-18",
    }
    cleaned, reasons = SalesTransformer.validate_and_transform_record(raw_record_null, "job-test-1")
    assert cleaned is None
    assert "MISSING_OR_NULL_AMOUNT" in reasons

    # Negative amount
    raw_record_neg = {
        "order_id": "ORD-003",
        "customer_email": "valid@example.com",
        "amount": -50.0,
        "order_date": "2026-05-18",
    }
    cleaned, reasons = SalesTransformer.validate_and_transform_record(raw_record_neg, "job-test-1")
    assert cleaned is None
    assert "NON_POSITIVE_AMOUNT" in reasons

    # Zero amount
    raw_record_zero = {
        "order_id": "ORD-004",
        "customer_email": "valid@example.com",
        "amount": 0.0,
        "order_date": "2026-05-18",
    }
    cleaned, reasons = SalesTransformer.validate_and_transform_record(raw_record_zero, "job-test-1")
    assert cleaned is None
    assert "NON_POSITIVE_AMOUNT" in reasons


def test_sales_transformer_invalid_email():
    raw_record = {
        "order_id": "ORD-005",
        "customer_email": "invalid-email-address",
        "amount": 100.00,
        "order_date": "2026-05-18",
    }
    cleaned, reasons = SalesTransformer.validate_and_transform_record(raw_record, "job-test-1")
    assert cleaned is None
    assert "INVALID_EMAIL_FORMAT" in reasons


def test_sales_transformer_batch_processing():
    raw_batch = [
        {"order_id": "ORD-1", "customer_email": "a@test.com", "amount": 10.0, "order_date": "2026-05-18"},
        {"order_id": "ORD-2", "customer_email": "bad-email", "amount": 20.0, "order_date": "2026-05-18"},
        {"order_id": "ORD-3", "customer_email": "c@test.com", "amount": None, "order_date": "2026-05-18"},
        {"order_id": "ORD-4", "customer_email": "d@test.com", "amount": 40.0, "order_date": "2026-05-18"},
    ]
    valid, rejected, metrics = SalesTransformer.process_batch(raw_batch, "job-test-batch")
    assert len(valid) == 2
    assert len(rejected) == 2
    assert metrics["extracted_records"] == 4
    assert metrics["valid_records_loaded"] == 2
    assert metrics["total_filtered_records"] == 2
    assert metrics["filtered_by_missing_amount"] == 1
    assert metrics["filtered_by_invalid_email"] == 1


# ============================================================================
# Extractor & DLQ Service Tests
# ============================================================================

def test_pg_extractor_and_dlq_service():
    db = TestingSessionLocal()
    try:
        # Seed test records
        order1 = RawSalesOrder(
            order_id="ORD-EXT-1",
            customer_email="test1@domain.com",
            amount=120.00,
            order_date=datetime.date(2026, 5, 18),
        )
        order2 = RawSalesOrder(
            order_id="ORD-EXT-2",
            customer_email="invalid_email",
            amount=300.00,
            order_date=datetime.date(2026, 5, 18),
        )
        db.add_all([order1, order2])
        db.commit()

        extractor = PostgreSQLExtractor(db)
        orders = extractor.extract_orders()
        assert len(orders) == 2

        # Test DLQ persistence
        saved = DLQService.save_quarantine_records(
            db,
            "job-dlq-test",
            [{"raw_record": {"order_id": "ORD-EXT-2"}, "rejection_reasons": ["INVALID_EMAIL_FORMAT"]}],
        )
        assert saved == 1
        dlq_records = db.query(QuarantineRecordModel).filter(QuarantineRecordModel.job_id == "job-dlq-test").all()
        assert len(dlq_records) == 1
    finally:
        db.close()


# ============================================================================
# API Controller Integration Tests
# ============================================================================

def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "sales-etl-pipeline"


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Sales Data ETL Pipeline"


def test_etl_job_run_and_status_flow():
    # Seed sample orders into database
    db = TestingSessionLocal()
    try:
        o1 = RawSalesOrder(
            order_id="ORD-E2E-1",
            customer_email="user1@example.com",
            amount=99.99,
            order_date=datetime.date(2026, 5, 18),
        )
        o2 = RawSalesOrder(
            order_id="ORD-E2E-2",
            customer_email="bad_email_format",
            amount=50.00,
            order_date=datetime.date(2026, 5, 18),
        )
        o3 = RawSalesOrder(
            order_id="ORD-E2E-3",
            customer_email="user3@example.com",
            amount=None,
            order_date=datetime.date(2026, 5, 18),
        )
        db.add_all([o1, o2, o3])
        db.commit()
    finally:
        db.close()

    # 1. Trigger Job
    payload = {
        "start_date": "2026-05-01",
        "end_date": "2026-05-31",
        "batch_size": 1000,
        "dry_run": False,
    }
    run_response = client.post("/api/v1/etl/jobs/sales-orders/run", json=payload)
    assert run_response.status_code == 202
    job_id = run_response.json()["job_id"]
    assert job_id.startswith("job_")

    # 2. Query Job Status
    status_response = client.get(f"/api/v1/etl/jobs/sales-orders/status/{job_id}")
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["job_id"] == job_id
    assert status_data["status"] == "COMPLETED"
    assert status_data["metrics"]["extracted_records"] == 3
    assert status_data["metrics"]["valid_records_loaded"] == 1
    assert status_data["metrics"]["total_filtered_records"] == 2
    assert status_data["metrics"]["filtered_by_missing_amount"] == 1
    assert status_data["metrics"]["filtered_by_invalid_email"] == 1
    assert status_data["destination"]["table"] == "fct_sales_orders"
    assert status_data["destination"]["partition_field"] == "order_date"


def test_job_status_not_found():
    response = client.get("/api/v1/etl/jobs/sales-orders/status/non-existent-job")
    assert response.status_code == 404
