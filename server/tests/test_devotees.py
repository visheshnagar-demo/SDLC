def test_create_and_get_devotee(client):
    payload = {
        "full_name": "Ramesh Sharma",
        "email": "ramesh.sharma@example.com",
        "phone": "9812345678",
        "address": "45 Temple Street, Pune",
    }
    response = client.post("/api/v1/devotees", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["devotee_number"].startswith("DEV-2026-")
    devotee_id = data["id"]

    # Get devotee
    get_res = client.get(f"/api/v1/devotees/{devotee_id}")
    assert get_res.status_code == 200
    assert get_res.json()["phone"] == "9812345678"


def test_add_family_member(client):
    # First get or create a devotee
    dev_res = client.get("/api/v1/devotees")
    assert dev_res.status_code == 200
    devotees = dev_res.json()
    assert len(devotees) > 0
    devotee_id = devotees[0]["id"]

    family_payload = {
        "full_name": "Sita Sharma",
        "relationship": "Spouse",
        "gotra": "Kashyapa",
        "rashi": "Kanya",
        "nakshatra": "Hasta",
    }
    res = client.post(f"/api/v1/devotees/{devotee_id}/family", json=family_payload)
    assert res.status_code == 201
    assert res.json()["gotra"] == "Kashyapa"
