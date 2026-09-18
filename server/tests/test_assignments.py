def test_assign_and_unassign_device(client, admin_headers):
    # 1. Get available device and test employee
    devices = client.get(
        "/api/v1/devices?status=AVAILABLE", headers=admin_headers
    ).json()
    assert len(devices) > 0, "No available devices found"
    device_id = devices[0]["id"]

    users = client.get("/api/v1/users", headers=admin_headers).json()
    emp = next(u for u in users if u["email"] == "test@example.com")

    # 2. Assign device
    assign_payload = {"user_id": emp["id"], "notes": "Initial setup assignment"}
    response = client.post(
        f"/api/v1/devices/{device_id}/assign",
        json=assign_payload,
        headers=admin_headers,
    )
    assert response.status_code == 200
    assignment_data = response.json()
    assert assignment_data["device_id"] == device_id
    assert assignment_data["user_id"] == emp["id"]

    # Verify device status updated to ASSIGNED
    dev_res = client.get(f"/api/v1/devices/{device_id}", headers=admin_headers)
    assert dev_res.json()["status"] == "ASSIGNED"

    # 3. Attempting to assign again should return 400 Conflict/Bad Request
    dup_assign = client.post(
        f"/api/v1/devices/{device_id}/assign",
        json=assign_payload,
        headers=admin_headers,
    )
    assert dup_assign.status_code == 400

    # 4. Check assignment history
    history_res = client.get(
        f"/api/v1/devices/{device_id}/assignments", headers=admin_headers
    )
    assert history_res.status_code == 200
    assert len(history_res.json()) >= 1

    # 5. Unassign device
    unassign_payload = {
        "notes": "Employee returned device",
        "target_status": "AVAILABLE",
    }
    unassign_res = client.post(
        f"/api/v1/devices/{device_id}/unassign",
        json=unassign_payload,
        headers=admin_headers,
    )
    assert unassign_res.status_code == 200
    assert unassign_res.json()["returned_at"] is not None

    # Verify device status updated back to AVAILABLE
    dev_res_after = client.get(f"/api/v1/devices/{device_id}", headers=admin_headers)
    assert dev_res_after.json()["status"] == "AVAILABLE"


def test_list_users(client, admin_headers):
    response = client.get("/api/v1/users", headers=admin_headers)
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert any(u["email"] == "admin@example.com" for u in users)
    assert any(u["email"] == "test@example.com" for u in users)
