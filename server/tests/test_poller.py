import pytest
import datetime
import httpx
from sqlalchemy.orm import Session
from server.models.api_model import ApiEndpoint
from server.models.health_log_model import HealthLog
from server.services.health_poller import HealthPoller, mask_headers
from server.services.retention_worker import RetentionWorker


def test_mask_headers():
    headers = {
        "Authorization": "Bearer secret_12345",
        "X-API-KEY": "my-secret-key",
        "Content-Type": "application/json",
        "User-Agent": "HealthMonitor/1.0",
    }
    masked = mask_headers(headers)
    assert masked["Authorization"] == "******"
    assert masked["X-API-KEY"] == "******"
    assert masked["Content-Type"] == "application/json"
    assert masked["User-Agent"] == "HealthMonitor/1.0"


@pytest.mark.asyncio
async def test_poller_healthy(db_session: Session):
    api = ApiEndpoint(
        name="Healthy Mock API",
        target_url="https://mock.api/health",
        http_method="GET",
        expected_status=200,
        timeout_seconds=5.0,
    )
    db_session.add(api)
    db_session.commit()

    # Mock transport returning 200
    mock_transport = httpx.MockTransport(
        lambda request: httpx.Response(200, text='{"status": "ok"}')
    )
    async with httpx.AsyncClient(transport=mock_transport) as client:
        log = await HealthPoller.probe_endpoint(api, db_session, client=client)

    assert log.operational_status == "Healthy"
    assert log.response_status == 200
    assert log.is_success is True
    assert api.current_status == "Healthy"


@pytest.mark.asyncio
async def test_poller_status_mismatch_down(db_session: Session):
    api = ApiEndpoint(
        name="Down Mock API",
        target_url="https://mock.api/failing",
        http_method="GET",
        expected_status=200,
        timeout_seconds=5.0,
    )
    db_session.add(api)
    db_session.commit()

    mock_transport = httpx.MockTransport(
        lambda request: httpx.Response(502, text="Bad Gateway")
    )
    async with httpx.AsyncClient(transport=mock_transport) as client:
        log = await HealthPoller.probe_endpoint(api, db_session, client=client)

    assert log.operational_status == "Down"
    assert log.response_status == 502
    assert log.is_success is False
    assert "Expected status 200, received 502" in log.error_message
    assert api.current_status == "Down"


@pytest.mark.asyncio
async def test_poller_timeout_down(db_session: Session):
    api = ApiEndpoint(
        name="Timeout Mock API",
        target_url="https://mock.api/timeout",
        http_method="GET",
        expected_status=200,
        timeout_seconds=1.0,
    )
    db_session.add(api)
    db_session.commit()

    def raise_timeout(request):
        raise httpx.TimeoutException("Read timed out")

    mock_transport = httpx.MockTransport(raise_timeout)
    async with httpx.AsyncClient(transport=mock_transport) as client:
        log = await HealthPoller.probe_endpoint(api, db_session, client=client)

    assert log.operational_status == "Down"
    assert log.response_status is None
    assert log.is_success is False
    assert "timed out" in log.error_message.lower()
    assert api.current_status == "Down"


def test_retention_purge_old_logs(db_session: Session):
    api = ApiEndpoint(
        name="Purge Test API",
        target_url="https://mock.api/test",
        http_method="GET",
    )
    db_session.add(api)
    db_session.commit()

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    old_date = now - datetime.timedelta(days=35)
    recent_date = now - datetime.timedelta(days=5)

    old_log = HealthLog(
        api_id=api.id,
        latency_ms=100.0,
        operational_status="Healthy",
        is_success=True,
        checked_at=old_date,
    )
    recent_log = HealthLog(
        api_id=api.id,
        latency_ms=150.0,
        operational_status="Healthy",
        is_success=True,
        checked_at=recent_date,
    )
    db_session.add_all([old_log, recent_log])
    db_session.commit()

    purged = RetentionWorker.purge_old_logs(db_session, days=30)
    assert purged == 1

    remaining = db_session.query(HealthLog).filter(HealthLog.api_id == api.id).all()
    assert len(remaining) == 1
    assert remaining[0].id == recent_log.id
