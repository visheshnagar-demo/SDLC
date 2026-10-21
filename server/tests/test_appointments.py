def test_create_appointment_success(client, receptionist_headers):
    # Fetch doctor and patient
    docs = client.get("/api/v1/doctors", headers=receptionist_headers).json()
    patients = client.get("/api/v1/patients", headers=receptionist_headers).json()
    doc_id = docs[0]["id"]
    pat_id = patients[0]["id"]

    payload = {
        "doctor_id": doc_id,
        "patient_id": pat_id,
        "scheduled_start": "2026-06-01T10:00:00",
        "reason_for_visit": "Annual checkup",
    }
    response = client.post("/api/v1/appointments", json=payload, headers=receptionist_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["appointment_code"].startswith("APT-")
    assert data["status"] == "CONFIRMED"
    assert data["doctor_id"] == doc_id
    assert data["patient_id"] == pat_id

def test_double_booking_prevention_conflict_409(client, receptionist_headers):
    docs = client.get("/api/v1/doctors", headers=receptionist_headers).json()
    patients = client.get("/api/v1/patients", headers=receptionist_headers).json()
    doc_id = docs[0]["id"]
    pat_id = patients[0]["id"]

    # Try booking the exact same slot that was already booked in the previous test
    payload = {
        "doctor_id": doc_id,
        "patient_id": pat_id,
        "scheduled_start": "2026-06-01T10:00:00",
        "reason_for_visit": "Second booking attempt",
    }
    response = client.post("/api/v1/appointments", json=payload, headers=receptionist_headers)
    assert response.status_code == 409
    data = response.json()
    assert "detail" in data

def test_list_appointments(client, receptionist_headers):
    response = client.get("/api/v1/appointments", headers=receptionist_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_update_appointment_status(client, receptionist_headers):
    appointments = client.get("/api/v1/appointments", headers=receptionist_headers).json()
    apt_id = appointments[0]["id"]

    response = client.patch(
        f"/api/v1/appointments/{apt_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=receptionist_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "IN_PROGRESS"
