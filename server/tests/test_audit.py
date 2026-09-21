import pytest


def test_query_audit_logs(client):
    # Perform actions
    inmate_res = client.post("/api/v1/inmates", json={
        "inmate_number": "INM-AUDIT-TEST",
        "first_name": "Audit",
        "last_name": "Test",
        "date_of_birth": "1995-05-05",
        "security_tier": "MINIMUM"
    }, headers={"X-User-Role": "ADMIN"})
    assert inmate_res.status_code == 201

    # Retrieve audit logs
    logs_res = client.get("/api/v1/audit/logs", headers={"X-User-Role": "ADMIN"})
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) > 0
    assert any(log["action"] == "CREATE_INMATE" for log in logs)
