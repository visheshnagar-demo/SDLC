import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.database import Base, get_db
from server.main import app
from server.models import RawSalesOrder

# Set up test database with StaticPool for in-memory SQLite
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=test_engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_data():
    db = TestingSessionLocal()
    # Clear table
    db.query(RawSalesOrder).delete()
    db.commit()

    # Seed test records
    test_orders = [
        RawSalesOrder(
            order_id="tx_001",
            customer_id="cust_1",
            customer_email="valid1@example.com",
            order_date=datetime.date(2026, 5, 1),
            amount=150.0,
            currency="USD",
            status="completed",
        ),
        RawSalesOrder(
            order_id="tx_002",
            customer_id="cust_2",
            customer_email="invalid_email",
            order_date=datetime.date(2026, 5, 2),
            amount=200.0,
            currency="USD",
            status="completed",
        ),
        RawSalesOrder(
            order_id="tx_003",
            customer_id="cust_3",
            customer_email="valid2@example.com",
            order_date=datetime.date(2026, 5, 3),
            amount=None,  # missing amount
            currency="USD",
            status="completed",
        ),
        RawSalesOrder(
            order_id="tx_004",
            customer_id="cust_4",
            customer_email="valid3@example.com",
            order_date=datetime.date(2026, 5, 4),
            amount=-50.0,  # negative amount
            currency="USD",
            status="completed",
        ),
        RawSalesOrder(
            order_id="tx_005",
            customer_id="cust_5",
            customer_email="valid4@example.com",
            order_date=datetime.date(2026, 5, 5),
            amount=350.75,
            currency="USD",
            status="completed",
        ),
    ]
    db.add_all(test_orders)
    db.commit()
    db.close()


def test_pipeline_run_success():
    payload = {
        "start_date": "2026-05-01",
        "end_date": "2026-05-10",
        "batch_size": 100,
        "force_reload": False,
    }
    response = client.post("/api/v1/pipeline/run", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "COMPLETED"
    assert "job_id" in data
    assert "start_time" in data
    assert "end_time" in data
    assert "duration_seconds" in data

    metrics = data["metrics"]
    assert metrics["extracted_count"] == 5
    assert metrics["filtered_invalid_email"] == 1
    assert metrics["filtered_missing_amount"] == 2
    assert metrics["total_filtered"] == 3
    assert metrics["loaded_count"] == 2


def test_pipeline_trigger_alias():
    response = client.post("/api/v1/pipeline/trigger", json={})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["metrics"]["extracted_count"] == 5
    assert data["metrics"]["loaded_count"] == 2
