"""Audit logs viewing unit tests."""


def test_list_audit_logs(client, user_headers):
    # AC: Access Control & Security - Audit logs capture system actions
    response = client.get("/api/v1/audit-logs", headers=user_headers)
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) >= 1
    assert "action" in logs[0]
    assert "user_email" in logs[0]
    assert "status" in logs[0]


def test_filter_audit_logs_by_action(client, user_headers):
    response = client.get(
        "/api/v1/audit-logs?action=SYSTEM_INITIALIZE", headers=user_headers
    )
    assert response.status_code == 200
    logs = response.json()
    for log in logs:
        assert log["action"] == "SYSTEM_INITIALIZE"


def test_list_audit_logs_unauthenticated(client):
    response = client.get("/api/v1/audit-logs")
    assert response.status_code == 401
