"""Tests for Audit and Compliance Logging."""

from fastapi import status


def test_list_audit_logs(client, admin_token_headers):
    """Test retrieving audit logs."""
    response = client.get("/api/v1/audit-logs", headers=admin_token_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        log = data[0]
        assert "action" in log
        assert "target_resource" in log
        assert "status" in log
        assert "user_email" in log


def test_audit_logs_filter_by_action(client, admin_token_headers):
    """Test filtering audit logs by action."""
    response = client.get(
        "/api/v1/audit-logs?action=USER_LOGIN", headers=admin_token_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    for log in data:
        assert log["action"] == "USER_LOGIN"
