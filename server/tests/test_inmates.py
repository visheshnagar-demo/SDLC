import pytest


def test_create_and_get_inmate(client):
    payload = {
        "inmate_number": "INM-2001",
        "first_name": "Arthur",
        "last_name": "Morgan",
        "date_of_birth": "1978-05-12",
        "security_tier": "HIGH_SECURITY",
        "medical_alerts": ["HIGH_RISK_SUICIDE_WATCH"],
        "offense_history": [{"code": "OFF-101", "description": "Bank Robbery"}],
        "emergency_contacts": [{"name": "Dutch", "relation": "Associate", "phone": "555-0100"}],
    }

    response = client.post("/api/v1/inmates", json=payload, headers={"X-User-Role": "ADMIN"})
    assert response.status_code == 201
    data = response.json()
    assert data["inmate_number"] == "INM-2001"
    assert data["security_tier"] == "HIGH_SECURITY"
    assert "id" in data
    assert "HIGH_RISK_SUICIDE_WATCH" in data["medical_alerts"]

    inmate_id = data["id"]

    # Get by ID
    get_res = client.get(f"/api/v1/inmates/{inmate_id}")
    assert get_res.status_code == 200
    assert get_res.json()["first_name"] == "Arthur"

    # List inmates
    list_res = client.get("/api/v1/inmates?security_tier=HIGH_SECURITY")
    assert list_res.status_code == 200
    inmates = list_res.json()
    assert any(i["inmate_number"] == "INM-2001" for i in inmates)


def test_duplicate_inmate_number_rejected(client):
    payload = {
        "inmate_number": "INM-DUP-01",
        "first_name": "John",
        "last_name": "Marston",
        "date_of_birth": "1980-01-01",
        "security_tier": "MEDIUM",
    }
    res1 = client.post("/api/v1/inmates", json=payload, headers={"X-User-Role": "ADMIN"})
    assert res1.status_code == 201

    res2 = client.post("/api/v1/inmates", json=payload, headers={"X-User-Role": "ADMIN"})
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_guard_cannot_alter_medical_alerts(client):
    # Create inmate as ADMIN
    payload = {
        "inmate_number": "INM-GUARD-TEST",
        "first_name": "Bill",
        "last_name": "Williamson",
        "date_of_birth": "1975-03-20",
        "security_tier": "MEDIUM",
        "medical_alerts": [],
    }
    create_res = client.post("/api/v1/inmates", json=payload, headers={"X-User-Role": "ADMIN"})
    assert create_res.status_code == 201
    inmate_id = create_res.json()["id"]

    # Guard attempts to alter medical alerts -> 403 Forbidden
    update_payload = {"medical_alerts": ["CHRONIC_ASTHMA"]}
    guard_update_res = client.put(f"/api/v1/inmates/{inmate_id}", json=update_payload, headers={"X-User-Role": "GUARD"})
    assert guard_update_res.status_code == 403
    assert "Guards are not permitted" in guard_update_res.json()["detail"]

    # Admin alters medical alerts -> 200 OK
    admin_update_res = client.put(f"/api/v1/inmates/{inmate_id}", json=update_payload, headers={"X-User-Role": "ADMIN"})
    assert admin_update_res.status_code == 200
    assert "CHRONIC_ASTHMA" in admin_update_res.json()["medical_alerts"]
