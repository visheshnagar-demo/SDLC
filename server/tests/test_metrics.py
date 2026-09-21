import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.api_model import ApiEndpoint
from server.models.health_log_model import HealthLog


def test_metrics_calculation_and_timeframes(client: TestClient, db_session: Session):
    api = ApiEndpoint(
        name="Metrics Benchmark API",
        target_url="https://httpbin.org/get",
        http_method="GET",
        interval_seconds=60,
        expected_status=200,
        timeout_seconds=5.0,
    )
    db_session.add(api)
    db_session.commit()

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    # Insert 10 logs: 8 successful with latencies 100..800ms, 2 failed
    latencies = [100.0, 150.0, 200.0, 250.0, 300.0, 350.0, 400.0, 500.0]
    logs = []
    for i, lat in enumerate(latencies):
        logs.append(
            HealthLog(
                api_id=api.id,
                response_status=200,
                latency_ms=lat,
                operational_status="Healthy",
                is_success=True,
                checked_at=now - datetime.timedelta(hours=i + 1),
            )
        )
    # 2 failures
    logs.append(
        HealthLog(
            api_id=api.id,
            response_status=500,
            latency_ms=900.0,
            operational_status="Down",
            is_success=False,
            error_message="500 Internal Error",
            checked_at=now - datetime.timedelta(hours=10),
        )
    )
    logs.append(
        HealthLog(
            api_id=api.id,
            response_status=504,
            latency_ms=1000.0,
            operational_status="Down",
            is_success=False,
            error_message="Gateway Timeout",
            checked_at=now - datetime.timedelta(hours=12),
        )
    )
    db_session.add_all(logs)
    db_session.commit()

    # Query 24h metrics
    res_24h = client.get(f"/api/v1/apis/{api.id}/metrics?timeframe=24h")
    assert res_24h.status_code == 200
    m24 = res_24h.json()
    assert m24["timeframe"] == "24h"
    assert m24["total_probes"] == 10
    assert m24["failure_count"] == 2
    assert m24["uptime_pct"] == 80.0
    assert m24["avg_latency_ms"] > 0
    assert m24["p95_latency_ms"] >= 900.0
    assert len(m24["time_series"]) > 0

    # Query 7d metrics
    res_7d = client.get(f"/api/v1/apis/{api.id}/metrics?timeframe=7d")
    assert res_7d.status_code == 200
    m7 = res_7d.json()
    assert m7["timeframe"] == "7d"
    assert m7["total_probes"] == 10

    # Query 30d metrics
    res_30d = client.get(f"/api/v1/apis/{api.id}/metrics?timeframe=30d")
    assert res_30d.status_code == 200
    m30 = res_30d.json()
    assert m30["timeframe"] == "30d"


def test_metrics_empty_state(client: TestClient, db_session: Session):
    api = ApiEndpoint(
        name="Empty API",
        target_url="https://httpbin.org/get",
        http_method="GET",
    )
    db_session.add(api)
    db_session.commit()

    res = client.get(f"/api/v1/apis/{api.id}/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_probes"] == 0
    assert data["failure_count"] == 0
    assert data["uptime_pct"] == 100.0
    assert data["avg_latency_ms"] == 0.0


def test_global_metrics_summary(client: TestClient):
    res = client.get("/api/v1/metrics/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_apis" in data
    assert "overall_uptime_pct" in data
    assert "avg_latency_ms" in data
