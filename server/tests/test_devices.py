def test_create_and_get_device(client, admin_auth_headers):
    payload = {
        "serial_number": "SN-TEST-1001",
        "imei": "123456789012345",
        "model": "iPhone 15 Pro",
        "manufacturer": "Apple",
        "os_type": "iOS",
        "os_version": "17.2",
        "ownership_type": "Corporate",
        "status": "Available",
        "is_encrypted": True,
        "passcode_enforced": True,
    }

    # Register device
    res = client.post("/api/v1/devices", json=payload, headers=admin_auth_headers)
    assert res.status_code == 201
    device_data = res.json()
    device_id = device_data["id"]
    assert device_data["serial_number"] == "SN-TEST-1001"
    assert device_data["is_compliant"] is True

    # Get device by ID
    res_get = client.get(f"/api/v1/devices/{device_id}")
    assert res_get.status_code == 200
    assert res_get.json()["model"] == "iPhone 15 Pro"

    # List devices
    res_list = client.get("/api/v1/devices")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1


def test_assign_and_unassign_device(client, admin_auth_headers, user_auth_headers):
    # Register device
    dev_res = client.post(
        "/api/v1/devices",
        json={
            "serial_number": "SN-ASSIGN-2002",
            "model": "Galaxy S23",
            "manufacturer": "Samsung",
            "os_type": "Android",
            "os_version": "13.0",
            "is_encrypted": True,
            "passcode_enforced": True,
        },
        headers=admin_auth_headers,
    )
    assert dev_res.status_code == 201
    device_id = dev_res.json()["id"]

    # Get user id
    me_res = client.get("/api/v1/auth/me", headers=user_auth_headers)
    user_id = me_res.json()["id"]

    # Assign device using admin credentials
    assign_res = client.post(
        f"/api/v1/devices/{device_id}/assign",
        json={"user_id": user_id, "notes": "Assigned for remote work"},
        headers=admin_auth_headers,
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["device_id"] == device_id
    assert assign_res.json()["user_id"] == user_id

    # Verify regular user cannot assign
    non_admin_assign = client.post(
        f"/api/v1/devices/{device_id}/assign",
        json={"user_id": user_id},
        headers=user_auth_headers,
    )
    assert non_admin_assign.status_code == 403

    # Verify device status is "Assigned"
    dev_check = client.get(f"/api/v1/devices/{device_id}")
    assert dev_check.json()["status"] == "Assigned"

    # Get assignment history
    hist_res = client.get(f"/api/v1/devices/{device_id}/assignments")
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 1

    # Unassign device using admin credentials
    unassign_res = client.post(
        f"/api/v1/devices/{device_id}/unassign",
        json={"notes": "Returned by employee"},
        headers=admin_auth_headers,
    )
    assert unassign_res.status_code == 200
    assert unassign_res.json()["returned_at"] is not None

    # Verify device status returned to "Available"
    dev_check_after = client.get(f"/api/v1/devices/{device_id}")
    assert dev_check_after.json()["status"] == "Available"


def test_remote_action(client, admin_auth_headers):
    # Register device
    dev_res = client.post(
        "/api/v1/devices",
        json={
            "serial_number": "SN-ACTION-3003",
            "model": "Pixel 8",
            "manufacturer": "Google",
            "os_type": "Android",
            "os_version": "14.0",
        },
        headers=admin_auth_headers,
    )
    device_id = dev_res.json()["id"]

    # Trigger Remote Lock
    lock_res = client.post(
        f"/api/v1/devices/{device_id}/actions",
        json={"action_type": "Remote Lock", "reason": "Security audit"},
        headers=admin_auth_headers,
    )
    assert lock_res.status_code == 200
    assert lock_res.json()["action_type"] == "Remote Lock"
    assert lock_res.json()["status"] == "Completed"

    # Trigger Remote Wipe
    wipe_res = client.post(
        f"/api/v1/devices/{device_id}/actions",
        json={"action_type": "Remote Wipe", "reason": "Lost device"},
        headers=admin_auth_headers,
    )
    assert wipe_res.status_code == 200
    assert wipe_res.json()["action_type"] == "Remote Wipe"

    # Check device status is Wiped
    dev_check = client.get(f"/api/v1/devices/{device_id}")
    assert dev_check.json()["status"] == "Wiped"
