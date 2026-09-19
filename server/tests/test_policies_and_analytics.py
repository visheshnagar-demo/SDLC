def test_get_policies_and_update(client, admin_token_headers):
    # List policies
    get_res = client.get("/api/v1/policies", headers=admin_token_headers)
    assert get_res.status_code == 200
    policies = get_res.json()
    assert len(policies) >= 1

    policy_id = policies[0]["id"]
    # Update policy
    put_res = client.put(
        f"/api/v1/policies/{policy_id}",
        json={"min_os_version_ios": "16.0"},
        headers=admin_token_headers,
    )
    assert put_res.status_code == 200
    assert put_res.json()["min_os_version_ios"] == "16.0"


def test_analytics_dashboard(client, admin_token_headers):
    response = client.get("/api/v1/analytics/dashboard", headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_devices" in data
    assert "active_assignments" in data
    assert "available_devices" in data
    assert "os_distribution" in data


def test_audit_logs(client, admin_token_headers):
    response = client.get("/api/v1/audit-logs", headers=admin_token_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
