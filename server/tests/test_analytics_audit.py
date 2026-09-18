def test_dashboard_analytics(client, admin_headers):
    response = client.get("/api/v1/analytics/dashboard", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_devices" in data
    assert "active_assignments" in data
    assert "available_devices" in data
    assert "non_compliant_count" in data
    assert "os_distribution" in data
    assert "status_distribution" in data
    assert isinstance(data["os_distribution"], dict)


def test_query_audit_logs_admin(client, admin_headers):
    # Register a device to ensure an audit record is generated
    client.post(
        "/api/v1/devices",
        json={
            "serial_number": "SN-AUDIT-TEST-99",
            "imei": "999888777666555",
            "model": "Audit Test Device",
            "manufacturer": "TestCorp",
            "os_type": "Android",
            "os_version": "14.0",
        },
        headers=admin_headers,
    )

    response = client.get("/api/v1/audit-logs", headers=admin_headers)
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) > 0


def test_query_audit_logs_forbidden_for_employee(client, employee_headers):
    response = client.get("/api/v1/audit-logs", headers=employee_headers)
    assert response.status_code == 403
