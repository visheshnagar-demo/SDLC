"""Tests for authentication endpoints."""

import uuid


def test_login_seeded_parent(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["role"] == "PARENT"


def test_login_seeded_admin(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_register_and_get_me(client):
    unique_email = f"parent_{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": "newsecurepassword123",
            "role": "PARENT",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email

    # Access /api/v1/auth/me with bearer token
    token = data["access_token"]
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == unique_email


def test_register_duplicate_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 400
