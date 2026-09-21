def test_get_audit_logs(client, auth_headers):
    # Perform an action that logs an audit event
    client.get("/api/v1/inmates", headers=auth_headers)

    response = client.get("/api/v1/audit/logs", headers=auth_headers)
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) >= 1
    assert "action" in logs[0]
    assert "timestamp" in logs[0]
