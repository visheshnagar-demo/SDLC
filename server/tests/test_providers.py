"""Tests for Cloud Providers Management."""

from fastapi import status


def test_list_providers(client, readonly_token_headers):
    """Test listing cloud providers."""
    response = client.get("/api/v1/providers", headers=readonly_token_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    # Check that credentials field is NOT exposed in response schema
    for prov in data:
        assert "encrypted_credentials" not in prov
        assert "provider_type" in prov
        assert "name" in prov


def test_create_provider_as_admin(client, admin_token_headers):
    """Test creating a cloud provider as Admin."""
    response = client.post(
        "/api/v1/providers",
        json={
            "name": "Staging AWS Cloud",
            "provider_type": "AWS",
            "credentials": {
                "access_key": "AKIASTAGINGTEST123",
                "secret_key": "secret456",
            },
        },
        headers=admin_token_headers,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Staging AWS Cloud"
    assert data["provider_type"] == "AWS"
    assert data["is_active"] is True
    assert "id" in data


def test_create_provider_as_readonly_forbidden(client, readonly_token_headers):
    """Test creating a provider as read-only user returns 403 Forbidden."""
    response = client.post(
        "/api/v1/providers",
        json={
            "name": "Hacker Cloud",
            "provider_type": "GCP",
            "credentials": {"key": "value"},
        },
        headers=readonly_token_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_create_provider_unauthenticated(client):
    """Test creating a provider without token returns 401."""
    response = client.post(
        "/api/v1/providers",
        json={
            "name": "Anon Cloud",
            "provider_type": "AZURE",
            "credentials": {"key": "value"},
        },
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_provider_invalid_type(client, admin_token_headers):
    """Test creating a provider with unsupported provider type returns 400."""
    response = client.post(
        "/api/v1/providers",
        json={
            "name": "Invalid Cloud",
            "provider_type": "DIGITAL_OCEAN",
            "credentials": {},
        },
        headers=admin_token_headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
