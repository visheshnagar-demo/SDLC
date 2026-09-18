def test_list_devices(client, admin_headers):
    response = client.get("/api/v1/devices", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3


def test_list_devices_filtered(client, admin_headers):
    response = client.get("/api/v1/devices?os_type=iOS", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert all(dev["os_type"].lower() == "ios" for dev in data)


def test_register_device_success(client, admin_headers):
    new_device = {
        "serial_number": "SN-TEST-REG-010",
        "imei": "112233445566778",
        "model": "iPad Pro 11",
        "manufacturer": "Apple",
        "os_type": "iOS",
        "os_version": "17.0",
        "ownership_type": "CORPORATE",
        "status": "AVAILABLE",
        "is_encrypted": True,
        "passcode_enforced": True,
        "is_compliant": True,
    }
    response = client.post("/api/v1/devices", json=new_device, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["serial_number"] == "SN-TEST-REG-010"
    assert data["id"] is not None


def test_register_device_duplicate_imei(client, admin_headers):
    dup_device = {
        "serial_number": "SN-TEST-DUP-011",
        "imei": "358901234567890",  # Pre-seeded IMEI
        "model": "iPhone 14 Pro",
        "manufacturer": "Apple",
        "os_type": "iOS",
        "os_version": "17.0",
        "ownership_type": "CORPORATE",
        "status": "AVAILABLE",
        "is_encrypted": True,
        "passcode_enforced": True,
        "is_compliant": True,
    }
    response = client.post("/api/v1/devices", json=dup_device, headers=admin_headers)
    assert response.status_code == 409


def test_register_device_forbidden_for_employee(client, employee_headers):
    new_device = {
        "serial_number": "SN-TEST-EMP-012",
        "imei": "998877665544332",
        "model": "Galaxy Tab",
        "manufacturer": "Samsung",
        "os_type": "Android",
        "os_version": "13.0",
    }
    response = client.post("/api/v1/devices", json=new_device, headers=employee_headers)
    assert response.status_code == 403


def test_get_device_detail(client, admin_headers):
    devices = client.get("/api/v1/devices", headers=admin_headers).json()
    device_id = devices[0]["id"]

    response = client.get(f"/api/v1/devices/{device_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["id"] == device_id


def test_update_device(client, admin_headers):
    devices = client.get("/api/v1/devices", headers=admin_headers).json()
    device_id = devices[0]["id"]

    update_payload = {"model": "iPhone 14 Pro Max", "os_version": "17.4"}
    response = client.put(
        f"/api/v1/devices/{device_id}", json=update_payload, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["model"] == "iPhone 14 Pro Max"
    assert response.json()["os_version"] == "17.4"


def test_decommission_device(client, admin_headers):
    devices = client.get("/api/v1/devices", headers=admin_headers).json()
    device_id = devices[-1]["id"]

    response = client.delete(f"/api/v1/devices/{device_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "DECOMMISSIONED"
