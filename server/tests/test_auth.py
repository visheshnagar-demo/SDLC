"""Tests for Authentication and User Management."""

from fastapi import status


def test_health_check(client):
    """Test health check endpoints."""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "healthy"

    response_v1 = client.get("/api/v1/health")
    assert response_v1.status_code == status.HTTP_200_OK
    assert response_v1.json()["status"] == "healthy"


def test_login_admin_success(client):
    """Test successful login with admin credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "ADMIN"
    assert "user_id" in data


def test_login_readonly_success(client):
    """Test successful login with read-only user credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "READ_ONLY"


def test_login_invalid_password(client):
    """Test login with incorrect password returns 401."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_nonexistent_user(client):
    """Test login with non-existent user returns 401."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "anypassword"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_me_authenticated(client, admin_token_headers):
    """Test getting current user profile with valid JWT."""
    response = client.get("/api/v1/auth/me", headers=admin_token_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "admin@example.com"
    assert data["role"] == "ADMIN"
    assert data["is_active"] is True


def test_get_me_unauthenticated(client):
    """Test getting current user profile without JWT returns 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_register_user_success(client):
    """Test registering a new user."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newdev@example.com",
            "password": "strongpassword123",
            "full_name": "New Developer",
            "role": "READ_ONLY",
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "newdev@example.com"
    assert data["full_name"] == "New Developer"
    assert data["role"] == "READ_ONLY"


def test_register_duplicate_user(client):
    """Test registering an existing user returns 400."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "password": "password",
            "full_name": "Duplicate Admin",
            "role": "ADMIN",
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]
