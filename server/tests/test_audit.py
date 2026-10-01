from fastapi.testclient import TestClient


def test_list_audit_logs(client: TestClient, admin_headers: dict):
    # Register a patient to generate an audit log
    client.post(
        "/api/v1/patients",
        json={
            "first_name": "Audit",
            "last_name": "TestPatient",
            "date_of_birth": "1995-10-20",
            "gender": "Other",
            "national_id": "SSN-111-22-3333",
            "phone": "+1-555-0011",
            "emergency_contact": {
                "name": "Contact",
                "relationship": "Parent",
                "phone": "111",
            },
        },
        headers=admin_headers,
    )

    response = client.get("/api/v1/audit/logs", headers=admin_headers)
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) >= 1
    assert any(log["action"] == "REGISTER_PATIENT" for log in logs)


def test_audit_log_filtering(client: TestClient, admin_headers: dict):
    response = client.get(
        "/api/v1/audit/logs?entity_type=Patient", headers=admin_headers
    )
    assert response.status_code == 200
    logs = response.json()
    assert all(log["entity_type"] == "Patient" for log in logs)
