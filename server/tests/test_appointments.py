def test_list_doctors(client):
    response = client.get("/api/v1/doctors")
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) >= 1
    assert any(d["specialty"] == "Cardiology" for d in doctors)


def test_list_doctors_filter_department(client):
    response = client.get("/api/v1/doctors?department=Cardiology")
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) >= 1
    assert doctors[0]["department"] == "Cardiology"


def test_list_appointments(client):
    response = client.get("/api/v1/appointments")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_book_appointment_success(client, patient_headers):
    # Fetch patient and doctor IDs
    patients = client.get("/api/v1/patients").json()
    doctors = client.get("/api/v1/doctors").json()
    assert len(patients) > 0
    assert len(doctors) > 0

    patient_id = patients[0]["id"]
    doctor_id = doctors[0]["id"]

    appt_payload = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "appointment_date": "2026-07-15",
        "start_time": "14:00",
        "end_time": "14:30",
        "reason": "Routine Cardiology Consultation",
        "appointment_type": "Consultation",
    }
    response = client.post(
        "/api/v1/appointments", json=appt_payload, headers=patient_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "Scheduled"
    assert data["start_time"] == "14:00"
    assert data["doctor_id"] == doctor_id


def test_book_appointment_double_booking_conflict(client, patient_headers):
    patients = client.get("/api/v1/patients").json()
    doctors = client.get("/api/v1/doctors").json()

    patient_id = patients[0]["id"]
    doctor_id = doctors[0]["id"]

    slot_date = "2026-08-01"
    slot_time = "11:00"

    appt_payload = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "appointment_date": slot_date,
        "start_time": slot_time,
        "end_time": "11:30",
        "reason": "First Booking",
    }
    # First booking should succeed
    res1 = client.post(
        "/api/v1/appointments", json=appt_payload, headers=patient_headers
    )
    assert res1.status_code == 201

    # Second booking for the same doctor, date and start time MUST fail with 409 Conflict
    res2 = client.post(
        "/api/v1/appointments", json=appt_payload, headers=patient_headers
    )
    assert res2.status_code == 409
    assert "already booked" in res2.json()["detail"].lower()


def test_update_appointment_status(client, doctor_headers):
    # Get an appointment
    appointments = client.get("/api/v1/appointments").json()
    assert len(appointments) > 0
    appt_id = appointments[0]["id"]

    res = client.put(
        f"/api/v1/appointments/{appt_id}/status",
        json={"status": "In Progress"},
        headers=doctor_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "In Progress"
