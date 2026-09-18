def test_list_devices(client, admin_headers):
    response = client.get("/api/v1/devices", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_device(client, admin_headers):
    device_payload = {
        "serial_number": "SN-GALAXY-S24-001",
        "imei": "358901234567890",
        "model": "Galaxy S24 Ultra",
        "manufacturer": "Samsung",
        "os_type": "Android",
        "os_version": "14.0",
        "ownership_type": "CORPORATE",
        "status": "AVAILABLE",
        "is_encrypted": True,
        "passcode_enforced": True,
        "is_compliant": True,
    }
    response = client.post(
        "/api/v1/devices", json=device_payload, headers=admin_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["serial_number"] == "SN-GALAXY-S24-001"
    assert data["status"] == "AVAILABLE"
    assert "id" in data


def test_get_device(client, admin_headers):
    list_resp = client.get("/api/v1/devices", headers=admin_headers)
    device_id = list_resp.json()[0]["id"]

    response = client.get(f"/api/v1/devices/{device_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["id"] == device_id


def test_update_device(client, admin_headers):
    list_resp = client.get("/api/v1/devices", headers=admin_headers)
    device_id = list_resp.json()[0]["id"]

    update_payload = {"os_version": "17.4"}
    response = client.put(
        f"/api/v1/devices/{device_id}", json=update_payload, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["os_version"] == "17.4"


def test_assign_and_unassign_device(client, admin_headers):
    # Get test user
    users_resp = client.get("/api/v1/users", headers=admin_headers)
    user_id = users_resp.json()[0]["id"]

    # Create new device for assignment
    device_payload = {
        "serial_number": "SN-ASSIGN-TEST-99",
        "imei": "864209876543210",
        "model": "Pixel 8 Pro",
        "manufacturer": "Google",
        "os_type": "Android",
        "os_version": "14.0",
        "ownership_type": "CORPORATE",
        "status": "AVAILABLE",
        "is_encrypted": True,
        "passcode_enforced": True,
        "is_compliant": True,
    }
    dev_resp = client.post(
        "/api/v1/devices", json=device_payload, headers=admin_headers
    )
    device_id = dev_resp.json()["id"]

    # Assign
    assign_resp = client.post(
        f"/api/v1/devices/{device_id}/assign",
        json={"user_id": user_id, "notes": "Assigned for QA testing"},
        headers=admin_headers,
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["user_id"] == user_id

    # Verify device status is ASSIGNED
    dev_check = client.get(f"/api/v1/devices/{device_id}", headers=admin_headers)
    assert dev_check.json()["status"] == "ASSIGNED"

    # Unassign
    unassign_resp = client.post(
        f"/api/v1/devices/{device_id}/unassign",
        json={"status_after_unassign": "AVAILABLE", "notes": "Returned intact"},
        headers=admin_headers,
    )
    assert unassign_resp.status_code == 200
    assert unassign_resp.json()["returned_at"] is not None

    # Verify status is AVAILABLE
    dev_check2 = client.get(f"/api/v1/devices/{device_id}", headers=admin_headers)
    assert dev_check2.json()["status"] == "AVAILABLE"


def test_trigger_remote_action(client, admin_headers):
    list_resp = client.get("/api/v1/devices", headers=admin_headers)
    device_id = list_resp.json()[0]["id"]

    action_payload = {
        "action_type": "REMOTE_LOCK",
        "reason": "Security diagnostic test",
    }
    response = client.post(
        f"/api/v1/devices/{device_id}/actions",
        json=action_payload,
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["action_type"] == "REMOTE_LOCK"
    assert response.json()["status"] == "EXECUTED"


def test_decommission_device(client, admin_headers):
    device_payload = {
        "serial_number": "SN-DECOM-001",
        "imei": "112233445566778",
        "model": "iPad Air",
        "manufacturer": "Apple",
        "os_type": "iOS",
        "os_version": "16.0",
        "ownership_type": "CORPORATE",
        "status": "AVAILABLE",
        "is_encrypted": True,
        "passcode_enforced": True,
        "is_compliant": True,
    }
    dev_resp = client.post(
        "/api/v1/devices", json=device_payload, headers=admin_headers
    )
    device_id = dev_resp.json()["id"]

    response = client.delete(f"/api/v1/devices/{device_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "DECOMMISSIONED"
