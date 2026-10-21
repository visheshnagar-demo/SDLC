def test_register_patient(client, receptionist_headers):
    payload = {
        "first_name": "Alice",
        "last_name": "Walker",
        "date_of_birth": "1990-07-20",
        "gender": "FEMALE",
        "phone_number": "+1-555-0200",
        "email": "alice.walker@example.com",
        "address": "456 Elm St, Cityville",
        "emergency_contact_name": "Bob Walker",
        "emergency_contact_phone": "+1-555-0201",
        "insurance_provider": "Aetna",
        "insurance_policy_number": "AET-554433",
    }
    response = client.post(
        "/api/v1/patients", json=payload, headers=receptionist_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Alice"
    assert data["last_name"] == "Walker"
    assert data["patient_code"].startswith("PAT-")
    assert data["insurance_provider"] == "Aetna"
    assert "id" in data


def test_get_patients_list_and_search(client, receptionist_headers):
    # Search for seeded John Doe or Alice
    response = client.get("/api/v1/patients?search=John", headers=receptionist_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1
    assert any(p["first_name"] == "John" for p in data["items"])


def test_get_patient_by_id(client, receptionist_headers):
    list_res = client.get("/api/v1/patients", headers=receptionist_headers)
    patient_id = list_res.json()["items"][0]["id"]

    response = client.get(
        f"/api/v1/patients/{patient_id}", headers=receptionist_headers
    )
    assert response.status_code == 200
    assert response.json()["id"] == patient_id


def test_update_patient_profile(client, receptionist_headers):
    list_res = client.get("/api/v1/patients", headers=receptionist_headers)
    patient_id = list_res.json()["items"][0]["id"]

    update_payload = {
        "phone_number": "+1-555-9999",
        "address": "789 New St, Metropolis",
    }
    response = client.put(
        f"/api/v1/patients/{patient_id}",
        json=update_payload,
        headers=receptionist_headers,
    )
    assert response.status_code == 200
    assert response.json()["phone_number"] == "+1-555-9999"
    assert response.json()["address"] == "789 New St, Metropolis"


def test_get_nonexistent_patient_404(client, receptionist_headers):
    response = client.get(
        "/api/v1/patients/nonexistent-uuid-12345", headers=receptionist_headers
    )
    assert response.status_code == 404
