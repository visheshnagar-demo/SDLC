from fastapi.testclient import TestClient


def test_create_and_get_api(client: TestClient):
    payload = {
        "name": "User Authentication Service",
        "target_url": "https://httpbin.org/status/200",
        "http_method": "GET",
        "interval_seconds": 60,
        "expected_status": 200,
        "timeout_seconds": 5.0,
        "request_headers": {"Authorization": "Bearer secret-token"},
        "is_active": True,
    }
    response = client.post("/api/v1/apis", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "User Authentication Service"
    assert data["target_url"] == "https://httpbin.org/status/200"
    assert data["http_method"] == "GET"
    assert data["interval_seconds"] == 60
    assert data["expected_status"] == 200
    assert data["is_active"] is True
    api_id = data["id"]

    # Get by ID
    get_res = client.get(f"/api/v1/apis/{api_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == api_id
    assert get_data["name"] == "User Authentication Service"
    assert "stats_24h" in get_data


def test_list_apis(client: TestClient):
    # Create two APIs
    client.post(
        "/api/v1/apis",
        json={
            "name": "Service Alpha",
            "target_url": "https://httpbin.org/get",
            "http_method": "GET",
            "interval_seconds": 30,
            "expected_status": 200,
            "timeout_seconds": 3.0,
        },
    )
    client.post(
        "/api/v1/apis",
        json={
            "name": "Service Beta",
            "target_url": "https://httpbin.org/post",
            "http_method": "POST",
            "interval_seconds": 300,
            "expected_status": 200,
            "timeout_seconds": 5.0,
        },
    )

    response = client.get("/api/v1/apis")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 2
    names = [item["name"] for item in items]
    assert "Service Alpha" in names
    assert "Service Beta" in names


def test_create_api_validation_errors(client: TestClient):
    # Invalid URL scheme
    bad_url_res = client.post(
        "/api/v1/apis",
        json={
            "name": "Bad URL",
            "target_url": "ftp://example.com",
            "http_method": "GET",
        },
    )
    assert bad_url_res.status_code in (400, 422)

    # Invalid HTTP Method
    bad_method_res = client.post(
        "/api/v1/apis",
        json={
            "name": "Bad Method",
            "target_url": "https://example.com",
            "http_method": "INVALID",
        },
    )
    assert bad_method_res.status_code in (400, 422)


def test_update_api(client: TestClient):
    create_res = client.post(
        "/api/v1/apis",
        json={
            "name": "Original Name",
            "target_url": "https://httpbin.org/get",
            "http_method": "GET",
            "interval_seconds": 60,
            "expected_status": 200,
            "timeout_seconds": 5.0,
        },
    )
    api_id = create_res.json()["id"]

    update_payload = {
        "name": "Updated Name",
        "interval_seconds": 300,
        "is_active": False,
    }
    update_res = client.put(f"/api/v1/apis/{api_id}", json=update_payload)
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "Updated Name"
    assert data["interval_seconds"] == 300
    assert data["is_active"] is False


def test_delete_api(client: TestClient):
    create_res = client.post(
        "/api/v1/apis",
        json={
            "name": "To Delete",
            "target_url": "https://httpbin.org/get",
            "http_method": "GET",
        },
    )
    api_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/apis/{api_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/v1/apis/{api_id}")
    assert get_res.status_code == 404


def test_trigger_manual_check(client: TestClient):
    create_res = client.post(
        "/api/v1/apis",
        json={
            "name": "Manual Probe Test",
            "target_url": "https://httpbin.org/status/200",
            "http_method": "GET",
            "expected_status": 200,
            "timeout_seconds": 5.0,
        },
    )
    api_id = create_res.json()["id"]

    check_res = client.post(f"/api/v1/apis/{api_id}/check")
    assert check_res.status_code == 200
    data = check_res.json()
    assert data["api_id"] == api_id
    assert "operational_status" in data
    assert "latency_ms" in data
