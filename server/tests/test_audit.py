def test_get_audit_logs(client, admin_headers):
    response = client.get("/api/v1/audit-logs", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
