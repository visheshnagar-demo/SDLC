import pytest
from datetime import date, datetime, timezone
from fastapi.testclient import TestClient

from server.main import app, run_pipeline_job
from server.database import Base, get_db, engine, SessionLocal
from server.models import RawSalesOrder
from server.schemas import PipelineRunRequest

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    test_orders = [
        # Valid order 1
        RawSalesOrder(
            order_id="ORD-001",
            customer_id="CUST-100",
            customer_email="valid.user1@example.com",
            order_date=date(2026, 5, 15),
            amount=150.00,
            currency="USD",
            status="completed",
            created_at=datetime.now(timezone.utc)
        ),
        # Valid order 2
        RawSalesOrder(
            order_id="ORD-002",
            customer_id="CUST-101",
            customer_email="valid.user2@domain.org",
            order_date=date(2026, 5, 16),
            amount=250.75,
            currency="USD",
            status="shipped",
            created_at=datetime.now(timezone.utc)
        ),
        # Invalid: Null amount
        RawSalesOrder(
            order_id="ORD-003",
            customer_id="CUST-102",
            customer_email="user3@example.com",
            order_date=date(2026, 5, 16),
            amount=None,
            currency="USD",
            status="pending",
            created_at=datetime.now(timezone.utc)
        ),
        # Invalid: Non-positive amount
        RawSalesOrder(
            order_id="ORD-004",
            customer_id="CUST-103",
            customer_email="user4@example.com",
            order_date=date(2026, 5, 17),
            amount=-20.00,
            currency="USD",
            status="pending",
            created_at=datetime.now(timezone.utc)
        ),
        # Invalid: Malformed email
        RawSalesOrder(
            order_id="ORD-005",
            customer_id="CUST-104",
            customer_email="invalid-email-address@",
            order_date=date(2026, 5, 18),
            amount=75.50,
            currency="USD",
            status="completed",
            created_at=datetime.now(timezone.utc)
        ),
        # Invalid: Empty email
        RawSalesOrder(
            order_id="ORD-006",
            customer_id="CUST-105",
            customer_email="",
            order_date=date(2026, 5, 18),
            amount=120.00,
            currency="USD",
            status="completed",
            created_at=datetime.now(timezone.utc)
        )
    ]

    session.add_all(test_orders)
    session.commit()
    session.close()


def test_pipeline_run_api_endpoint():
    payload = {
        "start_date": "2026-05-01",
        "end_date": "2026-05-31",
        "batch_size": 1000,
        "force_reload": False
    }

    response = client.post("/api/v1/pipeline/run", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["job_id"].startswith("etl-job-")
    assert "start_time" in data
    assert "end_time" in data
    assert data["duration_seconds"] >= 0.0

    metrics = data["metrics"]
    assert metrics["extracted_count"] == 6
    assert metrics["filtered_missing_amount"] == 2
    assert metrics["filtered_invalid_email"] == 2
    assert metrics["total_filtered"] == 4
    assert metrics["loaded_count"] == 2


def test_pipeline_run_date_filtering():
    payload = {
        "start_date": "2026-05-17",
        "end_date": "2026-05-18",
        "batch_size": 1000,
        "force_reload": False
    }

    response = client.post("/api/v1/pipeline/run", json=payload)
    assert response.status_code == 200

    data = response.json()
    metrics = data["metrics"]
    # Dates on 17th and 18th: ORD-004 (-20 amt), ORD-005 (bad email), ORD-006 (empty email)
    assert metrics["extracted_count"] == 3
    assert metrics["filtered_missing_amount"] == 1
    assert metrics["filtered_invalid_email"] == 2
    assert metrics["loaded_count"] == 0
