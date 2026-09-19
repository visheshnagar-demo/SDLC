def test_create_and_get_device(client, admin_token_headers):
    device_data = {
        "serial_number": "SN12345678",
        "imei": "358901234567890",
        "model": "iPhone 14 Pro",
        "manufacturer": "Apple",
        "os_type": "iOS",
        "os_version": "16.5",
        "ownership_type": "Corporate",
        "is_encrypted": True,
        "passcode_enforced": True,
    }
    response = client.post(
        "/api/v1/devices", json=device_data, headers=admin_token_headers
    )
    assert response.status_code == 201
    created = response.json()
    assert created["serial_number"] == "SN12345678"
    assert created["status"] == "Available"
    assert created["is_compliant"] is True

    device_id = created["id"]
    get_res = client.get(f"/api/v1/devices/{device_id}", headers=admin_token_headers)
    assert get_res.status_code == 200
    assert get_res.json()["model"] == "iPhone 14 Pro"


def test_list_devices(client, admin_token_headers):
    response = client.get("/api/v1/devices", headers=admin_token_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_update_device(client, admin_token_headers):
    device_data = {
        "serial_number": "SN87654321",
        "imei": "358901234567891",
        "model": "Galaxy S23",
        "manufacturer": "Samsung",
        "os_type": "Android",
        "os_version": "13.0",
    }
    create_res = client.post(
        "/api/v1/devices", json=device_data, headers=admin_token_headers
    )
    device_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/devices/{device_id}",
        json={"os_version": "14.0"},
        headers=admin_token_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["os_version"] == "14.0"


def test_decommission_device(client, admin_token_headers):
    device_data = {
        "serial_number": "SN_DEC_001",
        "model": "Pixel 7",
        "manufacturer": "Google",
        "os_type": "Android",
        "os_version": "13.0",
    }
    create_res = client.post(
        "/api/v1/devices", json=device_data, headers=admin_token_headers
    )
    device_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/devices/{device_id}", headers=admin_token_headers)
    assert del_res.status_code == 200

    get_res = client.get(f"/api/v1/devices/{device_id}", headers=admin_token_headers)
    assert get_res.json()["status"] == "Decommissioned"
