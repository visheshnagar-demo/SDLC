def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_user_register_and_login(client):
    # Register new user
    reg_payload = {
        "email": "newpatient@example.com",
        "password": "SecurePassword123!",
        "full_name": "New Patient",
        "phone_number": "+1-555-0999",
        "role": "PATIENT",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    user_data = reg_resp.json()
    assert user_data["email"] == "newpatient@example.com"
    assert user_data["role"] == "PATIENT"

    # Duplicate registration should return 400
    dup_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 400

    # Login with JSON payload
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "newpatient@example.com", "password": "SecurePassword123!"},
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    assert token_data["role"] == "PATIENT"

    # Test /api/v1/auth/me
    token = token_data["access_token"]
    me_resp = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "newpatient@example.com"


def test_login_invalid_credentials(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


def test_seeded_accounts_can_login(client):
    # Test regular user
    resp1 = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    assert resp1.status_code == 200
    assert resp1.json()["role"] == "PATIENT"

    # Test admin user
    resp2 = client.post(
        "/api/v1/auth/login",
        json={"username": "admin@example.com", "password": "adminpassword"},
    )
    assert resp2.status_code == 200
    assert resp2.json()["role"] == "ADMIN"

    # Test doctor user
    resp3 = client.post(
        "/api/v1/auth/login",
        json={"username": "doctor@example.com", "password": "doctorpassword"},
    )
    assert resp3.status_code == 200
    assert resp3.json()["role"] == "DOCTOR"
