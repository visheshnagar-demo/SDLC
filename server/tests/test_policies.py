def test_get_and_update_policies(client, admin_auth_headers):
    # Get policies
    res = client.get("/api/v1/policies", headers=admin_auth_headers)
    assert res.status_code == 200
    policies = res.json()
    assert len(policies) >= 1
    policy_id = policies[0]["id"]

    # Update policy
    update_res = client.put(
        f"/api/v1/policies/{policy_id}",
        json={"min_os_version_ios": "17.0"},
        headers=admin_auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["min_os_version_ios"] == "17.0"
