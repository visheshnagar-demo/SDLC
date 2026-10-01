from fastapi.testclient import TestClient


def test_book_appointment_success(client: TestClient, admin_headers: dict):
    payload = {
        "patient_id": "22222222-2222-4222-a222-222222222222",
        "doctor_id": "11111111-1111-4111-a111-111111111111",
        "appointment_time": "2026-06-01T10:00:00",
        "duration_minutes": 30,
        "reason": "Routine Cardiology Consultation",
    }
    response = client.post("/api/v1/appointments", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "SCHEDULED"
    assert data["doctor_id"] == "11111111-1111-4111-a111-111111111111"
    assert data["patient_id"] == "22222222-2222-4222-a222-222222222222"
    assert "id" in data


def test_double_booking_prevention(client: TestClient, admin_headers: dict):
    # Attempt to book the exact same slot for the same doctor
    payload = {
        "patient_id": "22222222-2222-4222-a222-222222222222",
        "doctor_id": "11111111-1111-4111-a111-111111111111",
        "appointment_time": "2026-06-01T10:00:00",
        "duration_minutes": 30,
        "reason": "Conflicting Booking Attempt",
    }
    response = client.post("/api/v1/appointments", json=payload, headers=admin_headers)
    assert response.status_code == 409
    assert "Double-booking" in response.json()["detail"]


def test_doctor_availability(client: TestClient, admin_headers: dict):
    doctor_id = "11111111-1111-4111-a111-111111111111"
    response = client.get(
        f"/api/v1/appointments/doctors/{doctor_id}/availability?date=2026-06-01",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["doctor_id"] == doctor_id
    assert "available_slots" in data
    # 10:00:00 should not be available because it was booked above
    slot_10am = next(
        (s for s in data["available_slots"] if "10:00:00" in s["start_time"]), None
    )
    assert slot_10am is not None
    assert slot_10am["is_available"] is False


def test_update_appointment_status(client: TestClient, admin_headers: dict):
    # First create an appointment to cancel/reschedule
    payload = {
        "patient_id": "22222222-2222-4222-a222-222222222222",
        "doctor_id": "11111111-1111-4111-a111-111111111111",
        "appointment_time": "2026-06-02T14:00:00",
        "duration_minutes": 30,
        "reason": "Follow-up",
    }
    create_res = client.post(
        "/api/v1/appointments", json=payload, headers=admin_headers
    )
    assert create_res.status_code == 201
    appt_id = create_res.json()["id"]

    # Change status to CONFIRMED
    patch_res = client.patch(
        f"/api/v1/appointments/{appt_id}/status",
        json={"status": "CONFIRMED"},
        headers=admin_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "CONFIRMED"

    # Change status to CANCELLED
    cancel_res = client.patch(
        f"/api/v1/appointments/{appt_id}/status",
        json={"status": "CANCELLED"},
        headers=admin_headers,
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"


def test_list_appointments(client: TestClient, admin_headers: dict):
    response = client.get("/api/v1/appointments", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
