from fastapi.testclient import TestClient


def test_get_api_health_logs(client: TestClient):
    """Verify retrieving paginated health logs for a specific API."""
    # Retrieve existing seeded auth service API
    apis_resp = client.get("/api/v1/apis")
    assert apis_resp.status_code == 200
    auth_api = next(
        (a for a in apis_resp.json() if a["name"] == "Auth Service Health"), None
    )
    assert auth_api is not None
    api_id = auth_api["id"]

    # Query all logs
    logs_resp = client.get(f"/api/v1/apis/{api_id}/logs?limit=10&offset=0")
    assert logs_resp.status_code == 200
    logs = logs_resp.json()
    assert isinstance(logs, list)
    assert len(logs) >= 1
    assert "latency_ms" in logs[0]
    assert "operational_status" in logs[0]
    assert "is_success" in logs[0]
    assert "checked_at" in logs[0]


def test_get_api_health_logs_filtering(client: TestClient):
    """Verify status filtering on API health logs."""
    apis_resp = client.get("/api/v1/apis")
    inventory_api = next(
        (a for a in apis_resp.json() if "Inventory" in a["name"]), None
    )
    assert inventory_api is not None
    api_id = inventory_api["id"]

    # Query failures filter
    failures_resp = client.get(f"/api/v1/apis/{api_id}/logs?status_filter=failures")
    assert failures_resp.status_code == 200
    logs = failures_resp.json()
    assert isinstance(logs, list)
    for log in logs:
        assert log["is_success"] is False


def test_global_failures_endpoint(client: TestClient):
    """Verify global failure inspector endpoint returns failure logs with API details."""
    resp = client.get("/api/v1/failures?limit=20")
    assert resp.status_code == 200
    failures = resp.json()
    assert isinstance(failures, list)
    assert len(failures) >= 1
    sample_failure = failures[0]
    assert "api_name" in sample_failure
    assert "target_url" in sample_failure
    assert "error_message" in sample_failure
    assert sample_failure["is_success"] is False
