from datetime import datetime, timedelta, timezone


def test_get_available_hosts(client):
    response = client.get("/api/v1/visitors/hosts")
    assert response.status_code == 200
    hosts = response.json()
    assert isinstance(hosts, list)
    assert len(hosts) >= 2
    emails = [h["email"] for h in hosts]
    assert "test@example.com" in emails


def test_register_visitor_success(client, host_user):
    start_time = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    payload = {
        "full_name": "Alice Wonderland",
        "email": "alice@wonderland.io",
        "phone": "+1-555-0199",
        "company": "Wonderland Tech",
        "purpose": "Vendor Security Assessment",
        "scheduled_start_time": start_time,
        "host_id": host_user.id,
    }

    response = client.post("/api/v1/visitors/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING_APPROVAL"
    assert data["purpose"] == "Vendor Security Assessment"
    assert data["visitor"]["email"] == "alice@wonderland.io"
    assert data["visitor"]["full_name"] == "Alice Wonderland"
    assert data["host"]["id"] == host_user.id
    assert len(data["audit_logs"]) >= 1
    assert data["audit_logs"][0]["action"] == "REGISTERED"


def test_register_visitor_invalid_host(client):
    start_time = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    payload = {
        "full_name": "Ghost Visitor",
        "email": "ghost@nowhere.com",
        "phone": "555-0000",
        "purpose": "Tour",
        "scheduled_start_time": start_time,
        "host_id": "00000000-0000-0000-0000-000000000000",
    }

    response = client.post("/api/v1/visitors/register", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_register_visitor_validation_error(client):
    payload = {
        "full_name": "",
        "email": "invalid-email-format",
    }
    response = client.post("/api/v1/visitors/register", json=payload)
    assert response.status_code == 422
