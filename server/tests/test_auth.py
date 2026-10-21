"""Tests for authentication and user management routes."""
import pytest


def test_register_user_success(client):
    """Test registering a new attendee account."""
    payload = {
        "email": "newattendee@example.com",
        "password": "securepassword123",
        "full_name": "Priya Sharma",
        "phone": "+14155550201",
        "role": "ATTENDEE",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newattendee@example.com"
    assert data["full_name"] == "Priya Sharma"
    assert "password_hash" not in data


def test_register_duplicate_email(client):
    """Test registering with an existing email returns 400 Bad Request."""
    payload = {
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Duplicate User",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(client):
    """Test login returns JWT access token and user info."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@example.com"


def test_login_invalid_credentials(client):
    """Test login with wrong password returns 401 Unauthorized."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_get_me_authenticated(client, user_token):
    """Test retrieving current user profile with valid Bearer token."""
    headers = {"Authorization": f"Bearer {user_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "ATTENDEE"


def test_get_me_unauthorized(client):
    """Test retrieving profile without token returns 401 Unauthorized."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
