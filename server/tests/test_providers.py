"""Cloud Provider management tests."""


def test_list_providers_authenticated(client, user_headers):
    # AC: Cloud Resource Dashboard - List cloud provider accounts
    response = client.get("/api/v1/providers", headers=user_headers)
    assert response.status_code == 200
    providers = response.json()
    assert isinstance(providers, list)
    assert len(providers) >= 3
    types = [p["provider_type"] for p in providers]
    assert "AWS" in types
    assert "GCP" in types
    assert "AZURE" in types


def test_list_providers_unauthenticated(client):
    # AC: Access Control & Security - Unauthenticated access is denied
    response = client.get("/api/v1/providers")
    assert response.status_code == 401


def test_create_provider_as_admin(client, admin_headers):
    # AC: Access Control & Security - Admin can register new provider
    payload = {
        "name": "Secondary AWS Account",
        "provider_type": "AWS",
        "account_id": "999888777666",
        "region": "us-west-2",
        "credentials_encrypted": "enc_data_blob_xyz",
    }
    response = client.post("/api/v1/providers", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Secondary AWS Account"
    assert data["provider_type"] == "AWS"
    assert "id" in data


def test_create_provider_as_read_only_user_forbidden(client, user_headers):
    # AC: Access Control & Security - Read-only user cannot register provider
    payload = {
        "name": "Unauthorized Provider",
        "provider_type": "GCP",
        "account_id": "gcp-unauth",
    }
    response = client.post("/api/v1/providers", json=payload, headers=user_headers)
    assert response.status_code == 403
    assert "Admin privileges required" in response.json()["detail"]


def test_get_provider_details(client, user_headers):
    # AC: Cloud Resource Dashboard - Retrieve details for specific provider
    response = client.get("/api/v1/providers/prov-aws-001", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "prov-aws-001"
    assert data["name"] == "AWS Production Account"


def test_get_nonexistent_provider(client, user_headers):
    response = client.get("/api/v1/providers/non-existent-id", headers=user_headers)
    assert response.status_code == 404
