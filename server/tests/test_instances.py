"""Tests for Cloud VM Instance Management & Lifecycle."""

from fastapi import status


def test_list_instances(client, readonly_token_headers):
    """Test listing instances."""
    response = client.get("/api/v1/instances", headers=readonly_token_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "id" in first
    assert "name" in first
    assert "status" in first
    assert "region" in first
    assert "instance_type" in first


def test_list_instances_filtered_by_status(client, readonly_token_headers):
    """Test filtering instances by status."""
    response = client.get(
        "/api/v1/instances?status=RUNNING", headers=readonly_token_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    for inst in data:
        assert inst["status"] == "RUNNING"


def test_get_instance_detail(client, readonly_token_headers):
    """Test getting single instance detail."""
    # First get list to find an existing ID
    list_res = client.get("/api/v1/instances", headers=readonly_token_headers)
    instance_id = list_res.json()[0]["id"]

    response = client.get(
        f"/api/v1/instances/{instance_id}", headers=readonly_token_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == instance_id


def test_get_instance_not_found(client, readonly_token_headers):
    """Test getting non-existent instance returns 404."""
    response = client.get(
        "/api/v1/instances/non-existent-uuid", headers=readonly_token_headers
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_provision_instance_as_admin(client, admin_token_headers):
    """Test provisioning a new VM instance as Admin."""
    prov_res = client.get("/api/v1/providers", headers=admin_token_headers)
    provider_id = prov_res.json()[0]["id"]

    response = client.post(
        "/api/v1/instances",
        json={
            "provider_id": provider_id,
            "name": "worker-node-09",
            "region": "us-west1",
            "instance_type": "e2-medium",
            "image_id": "debian-11",
        },
        headers=admin_token_headers,
    )
    assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_202_ACCEPTED]
    data = response.json()
    assert data["name"] == "worker-node-09"
    assert data["status"] == "PROVISIONING"
    assert "instance_id" in data or "id" in data


def test_provision_instance_as_readonly_forbidden(client, readonly_token_headers):
    """Test provisioning instance as read-only user returns 403 Forbidden."""
    prov_res = client.get("/api/v1/providers", headers=readonly_token_headers)
    provider_id = prov_res.json()[0]["id"]

    response = client.post(
        "/api/v1/instances",
        json={
            "provider_id": provider_id,
            "name": "unauthorized-vm",
            "region": "us-east-1",
            "instance_type": "t3.micro",
        },
        headers=readonly_token_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_instance_lifecycle_actions_as_admin(client, admin_token_headers):
    """Test START, STOP, RESTART, and TERMINATE lifecycle actions."""
    # List instances to find target
    list_res = client.get("/api/v1/instances", headers=admin_token_headers)
    inst_id = list_res.json()[0]["id"]

    # 1. Stop instance
    stop_res = client.post(
        f"/api/v1/instances/{inst_id}/action",
        json={"action": "STOP"},
        headers=admin_token_headers,
    )
    assert stop_res.status_code == status.HTTP_200_OK
    assert stop_res.json()["current_status"] == "STOPPED"

    # 2. Start instance
    start_res = client.post(
        f"/api/v1/instances/{inst_id}/action",
        json={"action": "START"},
        headers=admin_token_headers,
    )
    assert start_res.status_code == status.HTTP_200_OK
    assert start_res.json()["current_status"] == "RUNNING"

    # 3. Restart instance
    restart_res = client.post(
        f"/api/v1/instances/{inst_id}/action",
        json={"action": "RESTART"},
        headers=admin_token_headers,
    )
    assert restart_res.status_code == status.HTTP_200_OK
    assert restart_res.json()["current_status"] == "RUNNING"

    # 4. Terminate instance
    term_res = client.post(
        f"/api/v1/instances/{inst_id}/action",
        json={"action": "TERMINATE"},
        headers=admin_token_headers,
    )
    assert term_res.status_code == status.HTTP_200_OK
    assert term_res.json()["current_status"] == "TERMINATED"


def test_instance_action_as_readonly_forbidden(client, readonly_token_headers):
    """Test executing action as read-only user returns 403 Forbidden."""
    list_res = client.get("/api/v1/instances", headers=readonly_token_headers)
    inst_id = list_res.json()[0]["id"]

    response = client.post(
        f"/api/v1/instances/{inst_id}/action",
        json={"action": "STOP"},
        headers=readonly_token_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_instance_invalid_action(client, admin_token_headers):
    """Test executing unsupported action returns 400 Bad Request."""
    list_res = client.get("/api/v1/instances", headers=admin_token_headers)
    inst_id = list_res.json()[0]["id"]

    response = client.post(
        f"/api/v1/instances/{inst_id}/action",
        json={"action": "EXPLODE"},
        headers=admin_token_headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
