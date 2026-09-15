import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from server.app.models.ach_transfer import AchTransfer


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_normal_approval_under_5000(client):
    # AC: If cumulative rolling 24h sum <= $5,000: Approve request with requires_aml_review = false
    account_id = str(uuid.uuid4())
    payload = {
        "account_id": account_id,
        "amount": 2500.00,
        "recipient_account": "9876543210",
        "routing_number": "123456789",
    }
    response = client.post("/api/v1/ach/transfers/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["account_id"] == account_id
    assert data["amount"] == 2500.00
    assert data["rolling_24h_total"] == 2500.00
    assert data["status"] == "APPROVED"
    assert data["requires_aml_review"] is False
    assert "transfer_id" in data
    assert "created_at" in data


def test_normal_approval_exact_5000(client):
    # AC: Exact cumulative total of $5,000.00 is approved normally (requires_aml_review = false)
    account_id = str(uuid.uuid4())
    payload = {
        "account_id": account_id,
        "amount": 5000.00,
        "recipient_account": "1122334455",
        "routing_number": "123456789",
    }
    response = client.post("/api/v1/ach/transfers/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 5000.00
    assert data["rolling_24h_total"] == 5000.00
    assert data["requires_aml_review"] is False


def test_soft_limit_aml_flagging_over_5000(client):
    # AC: If cumulative rolling 24h sum > $5,000 and <= $10,000: Approve request and set requires_aml_review = true
    account_id = str(uuid.uuid4())

    # First transfer: $3,000 (total $3,000 <= $5,000 -> normal)
    resp1 = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 3000.00},
    )
    assert resp1.status_code == 201
    assert resp1.json()["requires_aml_review"] is False

    # Second transfer: $2,500 (total $5,500 > $5,000 and <= $10,000 -> AML review)
    resp2 = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 2500.00},
    )
    assert resp2.status_code == 201
    data = resp2.json()
    assert data["amount"] == 2500.00
    assert data["rolling_24h_total"] == 5500.00
    assert data["status"] == "APPROVED"
    assert data["requires_aml_review"] is True


def test_soft_limit_edge_case_5000_01(client):
    # AC: Exact edge case $5,000.01 triggers requires_aml_review = true
    account_id = str(uuid.uuid4())
    payload = {
        "account_id": account_id,
        "amount": 5000.01,
        "recipient_account": "1122334455",
        "routing_number": "123456789",
    }
    response = client.post("/api/v1/ach/transfers/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["rolling_24h_total"] == 5000.01
    assert data["requires_aml_review"] is True


def test_hard_limit_edge_case_exact_10000(client):
    # AC: Exact cumulative total of $10,000.00 is approved (flagged for AML review)
    account_id = str(uuid.uuid4())
    payload = {
        "account_id": account_id,
        "amount": 10000.00,
        "recipient_account": "1122334455",
        "routing_number": "123456789",
    }
    response = client.post("/api/v1/ach/transfers/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["rolling_24h_total"] == 10000.00
    assert data["status"] == "APPROVED"
    assert data["requires_aml_review"] is True


def test_hard_limit_rejection_over_10000(client):
    # AC: If cumulative rolling 24h sum > $10,000: Reject request with HTTP 429 and error VELOCITY_LIMIT_EXCEEDED
    account_id = str(uuid.uuid4())

    # Pre-populate $9,500 in approved transfers
    resp1 = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 9500.00},
    )
    assert resp1.status_code == 201

    # Attempt $600 (projected total $10,100.00 > $10,000.00)
    resp2 = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 600.00},
    )
    assert resp2.status_code == 429
    data = resp2.json()
    assert data["error_code"] == "VELOCITY_LIMIT_EXCEEDED"
    assert data["detail"] == "Rolling 24-hour ACH transfer limit exceeded."
    assert data["account_id"] == account_id
    assert data["attempted_amount"] == 600.00
    assert data["current_24h_total"] == 9500.00
    assert data["projected_24h_total"] == 10100.00
    assert data["limit"] == 10000.00


def test_hard_limit_edge_case_10000_01(client):
    # AC: Edge case $10,000.01 is rejected with HTTP 429
    account_id = str(uuid.uuid4())
    response = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 10000.01},
    )
    assert response.status_code == 429
    data = response.json()
    assert data["error_code"] == "VELOCITY_LIMIT_EXCEEDED"
    assert data["projected_24h_total"] == 10000.01


def test_correlation_id_propagation_and_generation(client):
    # AC: Include correlation ID header in API response for audit tracing
    account_id = str(uuid.uuid4())
    custom_cid = "123e4567-e89b-12d3-a456-426614174000"

    # Test custom correlation ID supplied in request
    resp_with_cid = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 1000.00},
        headers={"X-Correlation-ID": custom_cid},
    )
    assert resp_with_cid.status_code == 201
    assert resp_with_cid.headers.get("X-Correlation-ID") == custom_cid

    # Test auto-generated correlation ID when not supplied
    resp_without_cid = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 500.00},
    )
    assert resp_without_cid.status_code == 201
    auto_cid = resp_without_cid.headers.get("X-Correlation-ID")
    assert auto_cid is not None
    # Verify auto_cid is a valid UUID
    uuid.UUID(auto_cid)

    # Test correlation ID on 429 rejection response
    resp_rejected = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 9000.00},
        headers={"X-Correlation-ID": custom_cid},
    )
    assert resp_rejected.status_code == 429
    assert resp_rejected.headers.get("X-Correlation-ID") == custom_cid


def test_24_hour_rolling_window_expiration(client, db_session):
    # AC: Sum all outbound ACH transfers for Account ID in the last 24 hours (ignore older)
    account_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Insert an old transfer (25 hours ago) of $8,000 directly into DB
    old_transfer = AchTransfer(
        account_id=account_id,
        amount=Decimal("8000.00"),
        direction="OUTBOUND",
        transfer_type="ACH",
        status="APPROVED",
        requires_aml_review=True,
        correlation_id=str(uuid.uuid4()),
        created_at=now - timedelta(hours=25),
        updated_at=now - timedelta(hours=25),
    )
    db_session.add(old_transfer)

    # Insert a recent transfer (2 hours ago) of $2,000
    recent_transfer = AchTransfer(
        account_id=account_id,
        amount=Decimal("2000.00"),
        direction="OUTBOUND",
        transfer_type="ACH",
        status="APPROVED",
        requires_aml_review=False,
        correlation_id=str(uuid.uuid4()),
        created_at=now - timedelta(hours=2),
        updated_at=now - timedelta(hours=2),
    )
    db_session.add(recent_transfer)
    db_session.commit()

    # New transfer for $2,000 -> 24h sum should be $2,000 + $2,000 = $4,000 (<= $5,000 normal approval)
    # If the 25h-old transfer was incorrectly included, total would be $12,000 (rejection)
    response = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 2000.00},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["rolling_24h_total"] == 4000.00
    assert data["requires_aml_review"] is False


def test_inbound_transfers_and_rejected_transfers_excluded(client, db_session):
    # AC: Only OUTBOUND APPROVED ACH transfers count towards velocity sum
    account_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Insert an inbound transfer of $8,000
    inbound_transfer = AchTransfer(
        account_id=account_id,
        amount=Decimal("8000.00"),
        direction="INBOUND",
        transfer_type="ACH",
        status="APPROVED",
        requires_aml_review=False,
        correlation_id=str(uuid.uuid4()),
        created_at=now - timedelta(hours=1),
        updated_at=now - timedelta(hours=1),
    )
    # Insert a rejected outbound transfer of $9,000
    rejected_transfer = AchTransfer(
        account_id=account_id,
        amount=Decimal("9000.00"),
        direction="OUTBOUND",
        transfer_type="ACH",
        status="REJECTED",
        requires_aml_review=False,
        correlation_id=str(uuid.uuid4()),
        created_at=now - timedelta(hours=1),
        updated_at=now - timedelta(hours=1),
    )
    db_session.add_all([inbound_transfer, rejected_transfer])
    db_session.commit()

    # New outbound transfer for $3,000 -> rolling 24h outbound sum should be exactly $3,000
    response = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 3000.00},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["rolling_24h_total"] == 3000.00
    assert data["requires_aml_review"] is False


def test_invalid_payload_validation(client):
    # AC: API input validation errors return HTTP 422
    account_id = str(uuid.uuid4())

    # Test negative amount
    resp_negative = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": -100.00},
    )
    assert resp_negative.status_code == 422

    # Test zero amount
    resp_zero = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": account_id, "amount": 0.00},
    )
    assert resp_zero.status_code == 422

    # Test invalid UUID
    resp_invalid_uuid = client.post(
        "/api/v1/ach/transfers/evaluate",
        json={"account_id": "invalid-uuid-format", "amount": 500.00},
    )
    assert resp_invalid_uuid.status_code == 422
