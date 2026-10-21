def test_register_patient(client, receptionist_headers):
    payload = {
        "first_name": "Alice",
        "last_name": "Smith",
        "date_of_birth": "1990-05-15",
        "gender": "FEMALE",
        "phone_number": "555-0123",
        "email": "alice.smith@example.com",
        "address": "456 Oak St",
        "emergency_contact_name": "Bob Smith",
        "emergency_contact_phone": "555-0124",
        "insurance_provider": "Aetna",
        "insurance_policy_number": "AET-12345",
    }
    response = client.post("/api/v1/patients", json=payload, headers=receptionist_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Alice"
    assert data["last_name"] == "Smith"
    assert data["patient_code"].startswith("PAT-")
    assert data["id"] is not None

def test_list_patients(client, receptionist_headers):
    response = client.get("/api/v1/patients", headers=receptionist_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_patient_by_id(client, receptionist_headers):
    # List first to get ID
    list_res = client.get("/api/v1/patients", headers=receptionist_headers)
    patient_id = list_res.json()[0]["id"]

    response = client.get(f"/api/v1/patients/{patient_id}", headers=receptionist_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == patient_id

def test_get_patient_not_found(client, receptionist_headers):
    response = client.get("/api/v1/patients/non-existent-id", headers=receptionist_headers)
    assert response.status_code == 404

def test_update_patient(client, receptionist_headers):
    list_res = client.get("/api/v1/patients", headers=receptionist_headers)
    patient_id = list_res.json()[0]["id"]

    update_payload = {"phone_number": "555-9999", "address": "789 Pine Ave"}
    response = client.put(f"/api/v1/patients/{patient_id}", json=update_payload, headers=receptionist_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["phone_number"] == "555-9999"
    assert data["address"] == "789 Pine Ave"
