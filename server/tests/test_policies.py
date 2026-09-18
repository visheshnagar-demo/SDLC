def test_get_policies(client, user_headers):
    response = client.get("/api/v1/policies", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_policy(client, admin_headers):
    policy_payload = {
        "name": "Strict High Security Policy",
        "description": "Requires iOS 17 and Android 14 with passcode and encryption",
        "min_os_version_ios": "17.0",
        "min_os_version_android": "14.0",
        "require_encryption": True,
        "require_passcode": True,
        "is_active": True,
    }
    response = client.post(
        "/api/v1/policies", json=policy_payload, headers=admin_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Strict High Security Policy"
    assert data["min_os_version_ios"] == "17.0"


def test_update_policy(client, admin_headers):
    policies_resp = client.get("/api/v1/policies", headers=admin_headers)
    policy_id = policies_resp.json()[0]["id"]

    update_payload = {"min_os_version_ios": "16.5"}
    response = client.put(
        f"/api/v1/policies/{policy_id}", json=update_payload, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["min_os_version_ios"] == "16.5"
