from fastapi.testclient import TestClient


def test_health_endpoints(client: TestClient):
    """Verify service health endpoints return 200 OK."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

    resp_v1 = client.get("/api/v1/health")
    assert resp_v1.status_code == 200
    assert resp_v1.json()["status"] in ("ok", "degraded")
    assert "database" in resp_v1.json()


def test_dashboard_summary(client: TestClient):
    """Verify dashboard KPI summary returns aggregated counts and metrics."""
    resp = client.get("/api/v1/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_apis" in data
    assert "active_apis" in data
    assert "overall_uptime_pct" in data
    assert "average_latency_ms" in data


def test_list_apis(client: TestClient):
    """Verify listing monitored APIs returns existing seeded records."""
    resp = client.get("/api/v1/apis")
    assert resp.status_code == 200
    apis = resp.json()
    assert isinstance(apis, list)
    assert len(apis) >= 1
    assert "name" in apis[0]
    assert "target_url" in apis[0]
    assert "current_status" in apis[0]
    assert "stats_24h" in apis[0]


def test_create_and_get_api(client: TestClient):
    """Verify registering a new API endpoint and retrieving it by ID."""
    payload = {
        "name": "User Service Production",
        "target_url": "https://httpbin.org/get",
        "http_method": "GET",
        "interval_seconds": 60,
        "expected_status": 200,
        "timeout_seconds": 5.0,
        "request_headers": {"Authorization": "Bearer token123"},
        "is_active": True,
    }

    resp = client.post("/api/v1/apis", json=payload)
    assert resp.status_code == 201
    created = resp.json()
    api_id = created["id"]
    assert created["name"] == "User Service Production"
    assert created["target_url"] == "https://httpbin.org/get"
    assert created["http_method"] == "GET"
    assert created["interval_seconds"] == 60

    # Retrieve by ID
    get_resp = client.get(f"/api/v1/apis/{api_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == api_id
    assert get_resp.json()["name"] == "User Service Production"


def test_create_api_validation_errors(client: TestClient):
    """Verify validation errors for bad URLs and invalid HTTP methods."""
    # Invalid URL scheme
    bad_url_payload = {
        "name": "Invalid URL API",
        "target_url": "ftp://example.com/health",
        "http_method": "GET",
    }
    resp = client.post("/api/v1/apis", json=bad_url_payload)
    assert resp.status_code in (400, 422)

    # Invalid HTTP method
    bad_method_payload = {
        "name": "Invalid Method API",
        "target_url": "https://example.com/health",
        "http_method": "DELETE_ALL",
    }
    resp = client.post("/api/v1/apis", json=bad_method_payload)
    assert resp.status_code in (400, 422)


def test_update_api(client: TestClient):
    """Verify updating API configuration parameters and status."""
    # Create an API first
    create_resp = client.post(
        "/api/v1/apis",
        json={
            "name": "Metrics Engine API",
            "target_url": "https://httpbin.org/status/200",
            "http_method": "GET",
            "interval_seconds": 30,
        },
    )
    api_id = create_resp.json()["id"]

    # Update the API
    update_payload = {
        "name": "Metrics Engine API - Updated",
        "interval_seconds": 300,
        "is_active": False,
    }
    update_resp = client.put(f"/api/v1/apis/{api_id}", json=update_payload)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["name"] == "Metrics Engine API - Updated"
    assert updated_data["interval_seconds"] == 300
    assert updated_data["is_active"] is False


def test_delete_api(client: TestClient):
    """Verify deleting an API endpoint cascades and returns 204."""
    create_resp = client.post(
        "/api/v1/apis",
        json={
            "name": "Temporary API",
            "target_url": "https://httpbin.org/status/200",
            "http_method": "GET",
        },
    )
    api_id = create_resp.json()["id"]

    # Delete API
    del_resp = client.delete(f"/api/v1/apis/{api_id}")
    assert del_resp.status_code == 204

    # Verify 404 after deletion
    get_resp = client.get(f"/api/v1/apis/{api_id}")
    assert get_resp.status_code == 404


def test_not_found_handlers(client: TestClient):
    """Verify 404 responses for non-existent API IDs."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    assert client.get(f"/api/v1/apis/{fake_id}").status_code == 404
    assert (
        client.put(f"/api/v1/apis/{fake_id}", json={"name": "test"}).status_code == 404
    )
    assert client.delete(f"/api/v1/apis/{fake_id}").status_code == 404
    assert client.post(f"/api/v1/apis/{fake_id}/check").status_code == 404
    assert client.get(f"/api/v1/apis/{fake_id}/logs").status_code == 404
    assert client.get(f"/api/v1/apis/{fake_id}/metrics").status_code == 404
