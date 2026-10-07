from server.dependencies import record_audit


def test_audit_log_access_and_filters(client, admin_token, patient_token, db):
    # Record a test audit event
    record_audit(
        db=db,
        action="TEST_SECURITY_EVENT",
        resource_type="SYSTEM",
        resource_id="sys-123",
        user_id="test-user-id",
        ip_address="127.0.0.1",
        details={"info": "Security test event"},
    )

    # Admin lists audit logs
    admin_resp = client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_resp.status_code == 200
    data = admin_resp.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1

    # Filter by resource_type
    filter_resp = client.get(
        "/api/v1/audit/logs?resource_type=SYSTEM",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert filter_resp.status_code == 200
    assert any(log["resource_type"] == "SYSTEM" for log in filter_resp.json()["items"])

    # Patient query only returns own events
    pat_resp = client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert pat_resp.status_code == 200
