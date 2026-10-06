def test_list_patients(client):
    response = client.get("/api/v1/patients")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(p["mrn"] == "MRN-99201" for p in data)


def test_search_patients(client):
    response = client.get("/api/v1/patients?query=Jane")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["first_name"] == "Jane"


def test_create_patient(client, admin_headers):
    patient_payload = {
        "first_name": "Marcus",
        "last_name": "Vance",
        "date_of_birth": "1980-08-20",
        "gender": "Male",
        "phone": "+1 (555) 0122",
        "email": "marcus.vance@example.com",
        "address": "123 Elm St, Metropolis",
        "emergency_contact_name": "Sarah Vance",
        "emergency_contact_phone": "+1 (555) 0123",
        "emergency_contact_relationship": "Sister",
        "insurance_provider": "Aetna Health",
        "insurance_policy_number": "AET-77192",
        "insurance_status": "Active",
        "allergies": "Sulfa drugs",
    }
    response = client.post(
        "/api/v1/patients", json=patient_payload, headers=admin_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Marcus"
    assert data["last_name"] == "Vance"
    assert data["mrn"].startswith("MRN-")
    assert data["id"] is not None


def test_get_patient_by_id(client):
    # First get list to find an ID
    list_res = client.get("/api/v1/patients")
    assert list_res.status_code == 200
    patient_id = list_res.json()[0]["id"]

    response = client.get(f"/api/v1/patients/{patient_id}")
    assert response.status_code == 200
    assert response.json()["id"] == patient_id


def test_get_patient_by_mrn(client):
    response = client.get("/api/v1/patients/MRN-99201")
    assert response.status_code == 200
    assert response.json()["mrn"] == "MRN-99201"


def test_get_nonexistent_patient(client):
    response = client.get("/api/v1/patients/non-existent-uuid")
    assert response.status_code == 404


def test_update_patient(client, admin_headers):
    list_res = client.get("/api/v1/patients?query=Jane")
    patient = list_res.json()[0]
    patient_id = patient["id"]

    update_payload = {
        "phone": "+1 (555) 9999",
        "insurance_status": "Verified",
    }
    response = client.put(
        f"/api/v1/patients/{patient_id}", json=update_payload, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["phone"] == "+1 (555) 9999"
    assert response.json()["insurance_status"] == "Verified"
