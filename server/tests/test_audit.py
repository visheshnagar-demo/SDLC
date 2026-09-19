def test_list_audit_logs(client, admin_auth_headers):
    response = client.get("/api/v1/audit-logs", headers=admin_auth_headers)
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
