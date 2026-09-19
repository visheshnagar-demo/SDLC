def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_me(client, admin_token_headers):
    response = client.get("/api/v1/auth/me", headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@example.com"
    assert data["role"] == "admin"
