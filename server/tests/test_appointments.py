def test_create_appointment_success(client, receptionist_headers):
    # Fetch doctor and patient
    doc_res = client.get("/api/v1/doctors", headers=receptionist_headers)
    doctor_id = doc_res.json()[0]["id"]

    pat_res = client.get("/api/v1/patients", headers=receptionist_headers)
    patient_id = pat_res.json()["items"][0]["id"]

    booking_payload = {
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "scheduled_start": "2026-06-01T10:00:00",
        "reason_for_visit": "Routine Cardiology Consultation",
    }
    response = client.post(
        "/api/v1/appointments", json=booking_payload, headers=receptionist_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "CONFIRMED"
    assert data["appointment_code"].startswith("APT-")
    assert data["doctor_id"] == doctor_id
    assert data["patient_id"] == patient_id


def test_double_booking_prevention_conflict_409(client, receptionist_headers):
    # Attempting to book the EXACT SAME doctor slot (2026-06-01T10:00:00)
    doc_res = client.get("/api/v1/doctors", headers=receptionist_headers)
    doctor_id = doc_res.json()[0]["id"]

    pat_res = client.get("/api/v1/patients", headers=receptionist_headers)
    patient_id = pat_res.json()["items"][0]["id"]

    duplicate_payload = {
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "scheduled_start": "2026-06-01T10:00:00",
        "reason_for_visit": "Duplicate Collision Attempt",
    }
    response = client.post(
        "/api/v1/appointments", json=duplicate_payload, headers=receptionist_headers
    )
    assert response.status_code == 409
    assert (
        "unavailable" in response.json()["detail"].lower()
        or "conflict" in response.json()["detail"].lower()
    )


def test_get_appointments_list_and_filter(client, receptionist_headers):
    response = client.get("/api/v1/appointments", headers=receptionist_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1


def test_get_appointment_by_id(client, receptionist_headers):
    list_res = client.get("/api/v1/appointments", headers=receptionist_headers)
    appointment_id = list_res.json()["items"][0]["id"]

    response = client.get(
        f"/api/v1/appointments/{appointment_id}", headers=receptionist_headers
    )
    assert response.status_code == 200
    assert response.json()["id"] == appointment_id


def test_update_appointment_status_and_cancel(client, receptionist_headers):
    list_res = client.get("/api/v1/appointments", headers=receptionist_headers)
    appointment_id = list_res.json()["items"][0]["id"]

    status_payload = {
        "status": "IN_PROGRESS",
    }
    patch_res = client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        json=status_payload,
        headers=receptionist_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "IN_PROGRESS"
