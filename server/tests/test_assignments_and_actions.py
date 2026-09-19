def test_device_assignment_flow(client, admin_token_headers):
    # Register device
    dev_res = client.post(
        "/api/v1/devices",
        json={
            "serial_number": "SN_ASSIGN_01",
            "model": "iPad Air",
            "manufacturer": "Apple",
            "os_type": "iOS",
            "os_version": "16.0",
        },
        headers=admin_token_headers,
    )
    device_id = dev_res.json()["id"]

    # Get user id from /me
    me_res = client.get("/api/v1/auth/me", headers=admin_token_headers)
    user_id = me_res.json()["id"]

    # Assign device
    assign_res = client.post(
        f"/api/v1/devices/{device_id}/assign",
        json={"user_id": user_id, "notes": "Assigned for remote work"},
        headers=admin_token_headers,
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["device_id"] == device_id

    # Check status updated to Assigned
    dev_check = client.get(f"/api/v1/devices/{device_id}", headers=admin_token_headers)
    assert dev_check.json()["status"] == "Assigned"

    # Get assignments history
    history_res = client.get(
        f"/api/v1/devices/{device_id}/assignments", headers=admin_token_headers
    )
    assert history_res.status_code == 200
    assert len(history_res.json()) >= 1

    # Unassign device
    unassign_res = client.post(
        f"/api/v1/devices/{device_id}/unassign",
        json={"notes": "Returned upon employee request"},
        headers=admin_token_headers,
    )
    assert unassign_res.status_code == 200

    # Status updated back to Available
    dev_check2 = client.get(f"/api/v1/devices/{device_id}", headers=admin_token_headers)
    assert dev_check2.json()["status"] == "Available"


def test_remote_action_lock_and_wipe(client, admin_token_headers, user_token_headers):
    # Register device
    dev_res = client.post(
        "/api/v1/devices",
        json={
            "serial_number": "SN_ACTION_01",
            "model": "Galaxy Tab S8",
            "manufacturer": "Samsung",
            "os_type": "Android",
            "os_version": "12.0",
        },
        headers=admin_token_headers,
    )
    device_id = dev_res.json()["id"]

    # Non-admin user action attempt should fail with 403
    forbidden_res = client.post(
        f"/api/v1/devices/{device_id}/actions",
        json={"action_type": "Remote Wipe", "reason": "Lost device"},
        headers=user_token_headers,
    )
    assert forbidden_res.status_code == 403

    # Admin action attempt should succeed
    wipe_res = client.post(
        f"/api/v1/devices/{device_id}/actions",
        json={"action_type": "Remote Wipe", "reason": "Security protocol"},
        headers=admin_token_headers,
    )
    assert wipe_res.status_code == 200
    assert wipe_res.json()["status"] == "Completed"

    # Device status should become Wiped
    dev_check = client.get(f"/api/v1/devices/{device_id}", headers=admin_token_headers)
    assert dev_check.json()["status"] == "Wiped"
