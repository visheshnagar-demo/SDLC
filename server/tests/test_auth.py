from fastapi.testclient import TestClient


def test_login_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@example.com"
    assert data["user"]["role"] == "ADMIN"


def test_login_doctor_test_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_login_invalid_password(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]


def test_register_new_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newdoc@hospital.org",
            "username": "newdoc",
            "password": "securepassword123",
            "role": "DOCTOR",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newdoc@hospital.org"
    assert data["role"] == "DOCTOR"
    assert "id" in data


def test_register_duplicate_email(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "username": "another_admin",
            "password": "password",
            "role": "ADMIN",
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_get_current_user_me(client: TestClient, admin_headers: dict):
    response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@example.com"


def test_health_check(client: TestClient):
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
