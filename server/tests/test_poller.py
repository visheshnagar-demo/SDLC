import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
import httpx
from server.services.retention_worker import purge_expired_logs
from server.models.health_log_model import HealthLogModel
from server.models.api_model import APIModel


@pytest.mark.asyncio
async def test_manual_check_success(client: TestClient, monkeypatch):
    """Verify manual probe execution when target API responds with 200 OK."""
    apis_resp = client.get("/api/v1/apis")
    api_id = apis_resp.json()[0]["id"]

    mock_response = httpx.Response(
        status_code=200,
        text='{"status": "ok"}',
        request=httpx.Request("GET", "https://mock.test/health"),
    )

    async def mock_get(*args, **kwargs):
        return mock_response

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    check_resp = client.post(f"/api/v1/apis/{api_id}/check")
    assert check_resp.status_code == 200
    data = check_resp.json()
    assert data["response_status"] == 200
    assert data["is_success"] is True
    assert data["operational_status"] in ("Healthy", "Degraded")


@pytest.mark.asyncio
async def test_manual_check_down_status(client: TestClient, monkeypatch):
    """Verify manual probe execution when target API responds with 500 Internal Server Error."""
    create_resp = client.post(
        "/api/v1/apis",
        json={
            "name": "Failing API Service",
            "target_url": "https://httpbin.org/status/500",
            "http_method": "GET",
            "expected_status": 200,
        },
    )
    api_id = create_resp.json()["id"]

    mock_response = httpx.Response(
        status_code=500,
        text="Internal Server Error",
        request=httpx.Request("GET", "https://mock.test/fail"),
    )

    async def mock_get(*args, **kwargs):
        return mock_response

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    check_resp = client.post(f"/api/v1/apis/{api_id}/check")
    assert check_resp.status_code == 200
    data = check_resp.json()
    assert data["response_status"] == 500
    assert data["is_success"] is False
    assert data["operational_status"] == "Down"
    assert "error_message" in data


@pytest.mark.asyncio
async def test_manual_check_timeout(client: TestClient, monkeypatch):
    """Verify manual probe handling when request times out."""
    create_resp = client.post(
        "/api/v1/apis",
        json={
            "name": "Timing out API",
            "target_url": "https://httpbin.org/delay/10",
            "http_method": "GET",
            "timeout_seconds": 1.0,
        },
    )
    api_id = create_resp.json()["id"]

    async def mock_get(*args, **kwargs):
        raise httpx.TimeoutException("Mocked connection timeout")

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    check_resp = client.post(f"/api/v1/apis/{api_id}/check")
    assert check_resp.status_code == 200
    data = check_resp.json()
    assert data["response_status"] is None
    assert data["is_success"] is False
    assert data["operational_status"] == "Down"
    assert "timed out" in data["error_message"].lower()


def test_retention_purge_worker(db_session):
    """Verify retention cleanup deletes logs older than retention days."""
    api = APIModel(
        name="Retention Test API",
        target_url="https://example.com/test",
        http_method="GET",
    )
    db_session.add(api)
    db_session.commit()

    old_date = datetime.now(timezone.utc) - timedelta(days=35)
    recent_date = datetime.now(timezone.utc) - timedelta(days=5)

    old_log = HealthLogModel(
        api_id=api.id,
        latency_ms=100.0,
        operational_status="Healthy",
        is_success=True,
        checked_at=old_date,
    )
    recent_log = HealthLogModel(
        api_id=api.id,
        latency_ms=120.0,
        operational_status="Healthy",
        is_success=True,
        checked_at=recent_date,
    )
    db_session.add(old_log)
    db_session.add(recent_log)
    db_session.commit()

    old_log_id = str(old_log.id)
    recent_log_id = str(recent_log.id)

    # Purge logs older than 30 days
    purged_count = purge_expired_logs(db_session, retention_days=30)
    assert purged_count >= 1

    remaining_old = (
        db_session.query(HealthLogModel).filter(HealthLogModel.id == old_log_id).first()
    )
    assert remaining_old is None

    remaining_recent = (
        db_session.query(HealthLogModel)
        .filter(HealthLogModel.id == recent_log_id)
        .first()
    )
    assert remaining_recent is not None
