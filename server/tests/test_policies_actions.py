def test_get_policies(client, admin_headers):
    response = client.get("/api/v1/policies", headers=admin_headers)
    assert response.status_code == 200
    policies = response.json()
    assert isinstance(policies, list)
    assert len(policies) >= 1


def test_update_policy(client, admin_headers):
    policies = client.get("/api/v1/policies", headers=admin_headers).json()
    policy_id = policies[0]["id"]

    update_payload = {"min_os_version_ios": "17.0", "require_encryption": True}
    response = client.put(
        f"/api/v1/policies/{policy_id}", json=update_payload, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["min_os_version_ios"] == "17.0"


def test_trigger_remote_actions(client, admin_headers):
    devices = client.get("/api/v1/devices", headers=admin_headers).json()
    device_id = devices[0]["id"]

    # 1. Trigger REMOTE_LOCK
    lock_payload = {
        "action_type": "REMOTE_LOCK",
        "reason": "Security precaution for lost device",
    }
    lock_res = client.post(
        f"/api/v1/devices/{device_id}/actions", json=lock_payload, headers=admin_headers
    )
    assert lock_res.status_code == 200
    assert lock_res.json()["action_type"] == "REMOTE_LOCK"
    assert lock_res.json()["status"] == "EXECUTED"

    # 2. Trigger STATUS_CHECK
    status_payload = {
        "action_type": "STATUS_CHECK",
        "reason": "Routine compliance audit",
    }
    status_res = client.post(
        f"/api/v1/devices/{device_id}/actions",
        json=status_payload,
        headers=admin_headers,
    )
    assert status_res.status_code == 200
    assert status_res.json()["action_type"] == "STATUS_CHECK"

    # 3. Trigger REMOTE_WIPE
    wipe_payload = {
        "action_type": "REMOTE_WIPE",
        "reason": "Stolen device cryptographic wipe",
    }
    wipe_res = client.post(
        f"/api/v1/devices/{device_id}/actions", json=wipe_payload, headers=admin_headers
    )
    assert wipe_res.status_code == 200
    assert wipe_res.json()["action_type"] == "REMOTE_WIPE"

    # Verify device status changed to WIPED
    dev_res = client.get(f"/api/v1/devices/{device_id}", headers=admin_headers)
    assert dev_res.json()["status"] == "WIPED"
