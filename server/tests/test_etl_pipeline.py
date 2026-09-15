"""Comprehensive unit and integration tests for PostgreSQL to BigQuery ETL pipeline."""
from datetime import date, datetime
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from server.etl.extractor import PostgreSQLExtractor
from server.etl.validator import DataValidator
from server.etl.transformer import DataTransformer
from server.etl.runner import ETLRunner
from server.main import app


@pytest.fixture
def test_db_session():
    """In-memory SQLite database populated with test raw sales orders."""
    engine = create_engine("sqlite:///:memory:")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE raw_sales_orders (
                order_id VARCHAR(64) PRIMARY KEY,
                customer_email VARCHAR(255),
                amount NUMERIC(12, 2),
                order_date DATE,
                created_at TIMESTAMP
            )
        """))
        conn.execute(text("""
            INSERT INTO raw_sales_orders (order_id, customer_email, amount, order_date, created_at)
            VALUES 
                ('ORD-001', 'alice@example.com', 150.00, '2025-01-15', '2025-01-15 10:00:00'),
                ('ORD-002', 'bob.smith+promo@test.org', 299.99, '2025-01-16', '2025-01-16 11:30:00'),
                ('ORD-003', 'charlie@domain.com', NULL, '2025-01-17', '2025-01-17 12:00:00'),
                ('ORD-004', 'invalid-email-address', 75.50, '2025-01-18', '2025-01-18 13:00:00'),
                ('ORD-005', 'david@example.com', 0.00, '2025-01-19', '2025-01-19 14:00:00'),
                ('ORD-006', NULL, 120.00, '2025-01-20', '2025-01-20 15:00:00')
        """))
        conn.commit()

    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_validator_email_syntax():
    """Tests RFC 5322 email validation rules."""
    validator = DataValidator()
    assert validator.is_valid_email("user@example.com") is True
    assert validator.is_valid_email("john.doe+tag@sub.domain.co") is True
    assert validator.is_valid_email("first_last123@bfsi.org") is True

    assert validator.is_valid_email(None) is False
    assert validator.is_valid_email("") is False
    assert validator.is_valid_email("not-an-email") is False
    assert validator.is_valid_email("@nodomain.com") is False
    assert validator.is_valid_email("user@") is False


def test_validator_amount():
    """Tests amount positive and non-null constraints."""
    validator = DataValidator()
    assert validator.is_valid_amount(100.50) is True
    assert validator.is_valid_amount("45.99") is True
    assert validator.is_valid_amount(0.01) is True

    assert validator.is_valid_amount(None) is False
    assert validator.is_valid_amount("") is False
    assert validator.is_valid_amount(0) is False
    assert validator.is_valid_amount(-15.5) is False
    assert validator.is_valid_amount("invalid") is False


def test_validator_batch_processing():
    """Tests batch validation and counting of quarantined records."""
    validator = DataValidator()
    raw_records = [
        {"order_id": "1", "customer_email": "valid@example.com", "amount": 50.0, "order_date": "2025-01-01"},
        {"order_id": "2", "customer_email": "valid2@example.com", "amount": None, "order_date": "2025-01-01"},
        {"order_id": "3", "customer_email": "bademail", "amount": 100.0, "order_date": "2025-01-01"},
        {"order_id": "4", "customer_email": "valid4@example.com", "amount": -10.0, "order_date": "2025-01-01"},
    ]
    res = validator.validate_batch(raw_records)
    assert len(res.valid_records) == 1
    assert res.valid_records[0]["order_id"] == "1"
    assert res.filtered_missing_amount_count == 2
    assert res.filtered_invalid_email_count == 1
    assert len(res.quarantined_records) == 3


def test_transformer_enrichment():
    """Tests date formatting, audit metadata injection, and rounding."""
    transformer = DataTransformer(pipeline_run_id="run-12345")
    sample_records = [
        {
            "order_id": "ORD-100",
            "customer_email": "Customer@Example.com ",
            "amount": "123.456",
            "order_date": datetime(2025, 3, 15, 12, 0, 0),
        }
    ]
    transformed = transformer.transform_batch(sample_records)
    assert len(transformed) == 1
    rec = transformed[0]
    assert rec["order_id"] == "ORD-100"
    assert rec["customer_email"] == "customer@example.com"
    assert rec["amount"] == 123.46
    assert rec["order_date"] == "2025-03-15"
    assert rec["pipeline_run_id"] == "run-12345"
    assert "ingestion_timestamp" in rec


def test_end_to_end_pipeline_execution(test_db_session):
    """Tests full pipeline run extracting from DB, filtering, and running dry-run."""
    extractor = PostgreSQLExtractor(session=test_db_session)
    runner = ETLRunner(extractor=extractor, pipeline_run_id="test-run-e2e")
    result = runner.run(dry_run=True)

    assert result.status == "SUCCESS"
    assert result.extracted_records == 6
    assert result.filtered_missing_amount == 2  # ORD-003 (NULL) and ORD-005 (0.00)
    assert result.filtered_invalid_email == 2   # ORD-004 (invalid-email-address) and ORD-006 (NULL)
    assert result.loaded_records == 2           # ORD-001 and ORD-002
    assert result.pipeline_run_id == "test-run-e2e"


def test_fastapi_health_and_root():
    """Tests FastAPI web endpoints."""
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

    resp_api = client.get("/api/v1/health")
    assert resp_api.status_code == 200
