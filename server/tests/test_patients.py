from fastapi.testclient import TestClient


def test_register_patient_success(client: TestClient, admin_headers: dict):
    payload = {
        "first_name": "Robert",
        "last_name": "Taylor",
        "date_of_birth": "1985-04-12",
        "gender": "Male",
        "national_id": "SSN-999-88-7777",
        "phone": "+1-555-4321",
        "address": "456 Oak Street",
        "emergency_contact": {
            "name": "Sarah Taylor",
            "relationship": "Spouse",
            "phone": "+1-555-8765",
        },
        "insurance_info": {
            "provider": "Aetna",
            "policy_number": "AET-778899",
            "group_number": "GRP-3344",
        },
    }
    response = client.post("/api/v1/patients", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Robert"
    assert data["last_name"] == "Taylor"
    assert data["national_id"] == "SSN-999-88-7777"
    assert "id" in data
    assert data["emergency_contact"]["name"] == "Sarah Taylor"


def test_register_patient_duplicate_national_id(
    client: TestClient, admin_headers: dict
):
    # Try registering with existing national_id
    payload = {
        "first_name": "Duplicate",
        "last_name": "Person",
        "date_of_birth": "1992-01-01",
        "gender": "Female",
        "national_id": "SSN-000-11-2222",  # Already seeded
        "phone": "+1-555-0000",
        "emergency_contact": {"name": "Test", "relationship": "Friend", "phone": "123"},
    }
    response = client.post("/api/v1/patients", json=payload, headers=admin_headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_list_patients_and_search(client: TestClient, admin_headers: dict):
    response = client.get("/api/v1/patients?search=Jane", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(p["first_name"] == "Jane" for p in data)


def test_get_patient_by_id(client: TestClient, admin_headers: dict):
    patient_id = "22222222-2222-4222-a222-222222222222"
    response = client.get(f"/api/v1/patients/{patient_id}", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == patient_id
    assert data["first_name"] == "Jane"
    assert data["national_id"] == "SSN-000-11-2222"


def test_get_patient_not_found(client: TestClient, admin_headers: dict):
    response = client.get("/api/v1/patients/non-existent-id", headers=admin_headers)
    assert response.status_code == 404


def test_update_patient(client: TestClient, admin_headers: dict):
    patient_id = "22222222-2222-4222-a222-222222222222"
    response = client.put(
        f"/api/v1/patients/{patient_id}",
        json={"phone": "+1-555-9999", "address": "999 New Address St"},
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == "+1-555-9999"
    assert data["address"] == "999 New Address St"
