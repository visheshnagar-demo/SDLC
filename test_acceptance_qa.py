import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import server.models  # noqa: F401
from server.database import Base, get_db
from server.main import app

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def _schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _clean_db():
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_tc01_direct_text_entry_classification(client):
    payload = {
        "text": "Please review the quarterly financial report and provide your feedback by Friday.",
        "subject": "Q3 Financial Report Review",
        "sender": "finance-team@company.internal",
    }
    response = client.post("/api/v1/emails/classify", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["subject"] == "Q3 Financial Report Review"
    assert "classification" in data
    assert data["classification"]["primary_category"] in ["Work", "Personal", "Urgent", "Promotional"]
    assert 0.0 <= data["classification"]["confidence_score"] <= 100.0


def test_tc02_text_file_upload_classification(client):
    file_content = b"Special 50% discount on all cloud services this week only. Use coupon code FLASH50."
    files = {"file": ("discount_offer.txt", io.BytesIO(file_content), "text/plain")}
    response = client.post("/api/v1/emails/classify", files=files)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["classification"]["primary_category"] in ["Work", "Personal", "Urgent", "Promotional"]


def test_tc03_eml_file_upload_classification(client):
    eml_raw = (
        b"From: alice.dev@company.com\r\n"
        b"To: team@company.com\r\n"
        b"Subject: Urgent: Production outage on payment gateway\r\n"
        b"\r\n"
        b"All transactions are failing right now. Immediate fix required.\r\n"
    )
    files = {"file": ("outage.eml", io.BytesIO(eml_raw), "message/rfc822")}
    response = client.post("/api/v1/emails/classify", files=files)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["classification"]["primary_category"] == "Urgent"


def test_tc04_empty_body_validation(client):
    payload = {
        "text": "   ",
        "subject": "Empty body email",
    }
    response = client.post("/api/v1/emails/classify", json=payload)
    assert response.status_code in [400, 422]


def test_tc05_unsupported_file_format_rejection(client):
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00"
    files = {"file": ("malicious_payload.exe", io.BytesIO(fake_exe), "application/x-msdownload")}
    response = client.post("/api/v1/emails/classify", files=files)
    assert response.status_code == 400


def test_tc06_urgent_keyword_classification_and_confidence(client):
    payload = {
        "text": "Critical alert: Database connection pool exhausted. Immediate action required to prevent downtime.",
        "subject": "Urgent: Server Downtime Alert",
        "sender": "alerts@monitoring.internal",
    }
    response = client.post("/api/v1/emails/classify", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["classification"]["primary_category"] == "Urgent"
    assert 0.0 <= data["classification"]["confidence_score"] <= 100.0


def test_tc07_manual_override_category(client):
    create_resp = client.post(
        "/api/v1/emails/classify",
        json={
            "text": "Catch up for dinner and drinks this weekend?",
            "subject": "Weekend hangout",
            "sender": "friend@personal.com",
        },
    )
    assert create_resp.status_code == 201
    email_id = create_resp.json()["id"]

    override_resp = client.patch(
        f"/api/v1/emails/{email_id}",
        json={"category": "Promotional"},
    )
    assert override_resp.status_code == 200
    data = override_resp.json()
    assert data["classification"]["primary_category"] == "Promotional"


def test_tc08_manual_override_invalid_category_rejection(client):
    create_resp = client.post(
        "/api/v1/emails/classify",
        json={
            "text": "Task roadmap review discussion.",
            "subject": "Sprint planning",
            "sender": "team@work.com",
        },
    )
    assert create_resp.status_code == 201
    email_id = create_resp.json()["id"]

    override_resp = client.patch(
        f"/api/v1/emails/{email_id}",
        json={"category": "InvalidCategory123"},
    )
    assert override_resp.status_code in [400, 422]


def test_tc09_filter_by_category_and_keyword_search(client):
    client.post(
        "/api/v1/emails/classify",
        json={
            "text": "Production server outage emergency notice.",
            "subject": "Urgent: Server Downtime Alert",
            "sender": "ops@system.internal",
        },
    )
    client.post(
        "/api/v1/emails/classify",
        json={
            "text": "Lunch menu for this week in the cafeteria.",
            "subject": "Weekly Cafeteria Specials",
            "sender": "cafeteria@internal.com",
        },
    )

    resp = client.get("/api/v1/emails?category=Urgent&search=Downtime")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["classification"]["primary_category"] == "Urgent"
        assert "downtime" in item["subject"].lower() or "downtime" in item["body_text"].lower()


def test_tc10_filter_by_min_confidence_threshold(client):
    client.post(
        "/api/v1/emails/classify",
        json={
            "text": "Get 70% discount off all electronics right now! Limited time sale.",
            "subject": "Huge Holiday Flash Sale",
            "sender": "promos@store.com",
        },
    )

    resp = client.get("/api/v1/emails?min_confidence=50.0")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["classification"]["confidence_score"] >= 50.0