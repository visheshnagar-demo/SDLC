import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.api_model import ApiEndpoint
from server.models.health_log_model import HealthLog


def test_api_logs_and_filtering(client: TestClient, db_session: Session):
    api = ApiEndpoint(
        name="Log Test API",
        target_url="https://httpbin.org/get",
        http_method="GET",
        interval_seconds=60,
        expected_status=200,
        timeout_seconds=5.0,
    )
    db_session.add(api)
    db_session.commit()

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    # Add 3 logs: 2 healthy, 1 failure
    log1 = HealthLog(
        api_id=api.id,
        response_status=200,
        latency_ms=120.0,
        operational_status="Healthy",
        is_success=True,
        checked_at=now - datetime.timedelta(minutes=5),
    )
    log2 = HealthLog(
        api_id=api.id,
        response_status=500,
        latency_ms=850.0,
        operational_status="Down",
        is_success=False,
        error_message="Internal Server Error",
        checked_at=now - datetime.timedelta(minutes=3),
    )
    log3 = HealthLog(
        api_id=api.id,
        response_status=200,
        latency_ms=150.0,
        operational_status="Healthy",
        is_success=True,
        checked_at=now - datetime.timedelta(minutes=1),
    )
    db_session.add_all([log1, log2, log3])
    db_session.commit()

    # Query all logs
    res_all = client.get(f"/api/v1/apis/{api.id}/logs?limit=10&offset=0")
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert data_all["total"] == 3
    assert len(data_all["items"]) == 3

    # Query failure logs only
    res_fail = client.get(f"/api/v1/apis/{api.id}/logs?status_filter=failures")
    assert res_fail.status_code == 200
    data_fail = res_fail.json()
    assert data_fail["total"] == 1
    assert len(data_fail["items"]) == 1
    assert data_fail["items"][0]["response_status"] == 500
    assert data_fail["items"][0]["is_success"] is False

    # Query global failures
    res_global_fail = client.get("/api/v1/failures?limit=10")
    assert res_global_fail.status_code == 200
    failures = res_global_fail.json()
    assert len(failures) >= 1
    assert any(f["api_id"] == api.id for f in failures)
