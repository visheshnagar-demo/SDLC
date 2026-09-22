"""Authentication and RBAC unit tests."""


def test_login_success_admin(client):
    # AC: Access Control & Security - Admin login returns JWT bearer token
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@example.com"
    assert data["user"]["role"] == "admin"


def test_login_success_user(client):
    # AC: Access Control & Security - Read-only user login returns JWT bearer token
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["role"] == "read_only"


def test_login_invalid_password(client):
    # AC: Access Control & Security - Invalid credentials return 401
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "detail" in response.json()


def test_login_nonexistent_user(client):
    # AC: Access Control & Security - Unknown user returns 401
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@example.com", "password": "somepassword"},
    )
    assert response.status_code == 401


def test_get_me_authenticated(client, admin_headers):
    # AC: Access Control & Security - /auth/me returns current user profile
    response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@example.com"
    assert data["role"] == "admin"


def test_get_me_unauthenticated(client):
    # AC: Access Control & Security - /auth/me without token returns 401
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
