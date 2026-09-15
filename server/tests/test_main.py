def test_health_endpoints(client):
    res_health = client.get("/api/v1/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    res_ready = client.get("/api/v1/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"

    res_root = client.get("/")
    assert res_root.status_code == 200
    assert "documentation" in res_root.json()


def test_auth_login_success(client):
    payload = {"email": "test@example.com", "password": "testpassword"}
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["role"] == "HOST"


def test_auth_login_failure(client):
    payload = {"email": "test@example.com", "password": "wrongpassword"}
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


def test_auth_me_endpoint(client, host_headers):
    response = client.get("/api/v1/auth/me", headers=host_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "HOST"


def test_unauthorized_access(client):
    response = client.get("/api/v1/approvals/pending")
    assert response.status_code == 401
