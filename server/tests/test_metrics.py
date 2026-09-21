from fastapi.testclient import TestClient


def test_metrics_timeframes(client: TestClient):
    """Verify metrics calculation across 24h, 7d, and 30d timeframes."""
    apis_resp = client.get("/api/v1/apis")
    api_id = apis_resp.json()[0]["id"]

    for tf in ("24h", "7d", "30d"):
        resp = client.get(f"/api/v1/apis/{api_id}/metrics?timeframe={tf}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["timeframe"] == tf
        assert "uptime_pct" in data
        assert "avg_latency_ms" in data
        assert "p95_latency_ms" in data
        assert "time_series" in data
        assert isinstance(data["time_series"], list)
        assert len(data["time_series"]) > 0


def test_invalid_timeframe(client: TestClient):
    """Verify 400 Bad Request when passing an invalid timeframe parameter."""
    apis_resp = client.get("/api/v1/apis")
    api_id = apis_resp.json()[0]["id"]

    resp = client.get(f"/api/v1/apis/{api_id}/metrics?timeframe=1year")
    assert resp.status_code == 400
    assert "Invalid timeframe" in resp.json()["detail"]


def test_empty_metrics_handling(client: TestClient):
    """Verify empty state metrics calculation for newly registered API with no logs."""
    # Register a new API without logs
    create_resp = client.post(
        "/api/v1/apis",
        json={
            "name": "Brand New Endpoint",
            "target_url": "https://httpbin.org/status/200",
            "http_method": "GET",
        },
    )
    api_id = create_resp.json()["id"]

    resp = client.get(f"/api/v1/apis/{api_id}/metrics?timeframe=24h")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_probes"] == 0
    assert data["uptime_pct"] == 100.0
    assert data["avg_latency_ms"] == 0.0
    assert data["p95_latency_ms"] == 0.0
    assert data["failure_count"] == 0
    assert len(data["time_series"]) == 24
