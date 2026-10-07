from server.models import Doctor, Patient


def test_appointment_slots_and_booking_flow(client, patient_token, db):
    # Fetch doctor and patient IDs
    doc = db.query(Doctor).filter(Doctor.department == "Cardiology").first()
    pat = db.query(Patient).filter(Patient.national_id == "SSN-123-45-6789").first()

    # 1. Fetch available slots
    slots_resp = client.get(
        f"/api/v1/appointments/slots?doctor_id={doc.id}&date=2026-10-15"
    )
    assert slots_resp.status_code == 200
    slots = slots_resp.json()
    assert isinstance(slots, list)
    assert len(slots) > 0
    first_slot = slots[0]
    assert first_slot["is_available"] is True

    # 2. Book appointment in that slot
    booking_payload = {
        "patient_id": pat.id,
        "doctor_id": doc.id,
        "start_time": first_slot["slot_start"],
        "end_time": first_slot["slot_end"],
        "reason": "Routine Cardiology Consultation",
    }
    book_resp = client.post(
        "/api/v1/appointments",
        json=booking_payload,
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert book_resp.status_code == 201
    appt_data = book_resp.json()
    assert appt_data["status"] == "SCHEDULED"
    assert appt_data["patient_id"] == pat.id
    appt_id = appt_data["id"]

    # 3. Double-booking the same slot must return 409 Conflict
    conflict_resp = client.post(
        "/api/v1/appointments",
        json=booking_payload,
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert conflict_resp.status_code == 409

    # 4. Check slot availability now reflects booked status
    slots_after = client.get(
        f"/api/v1/appointments/slots?doctor_id={doc.id}&date=2026-10-15"
    ).json()
    assert slots_after[0]["is_available"] is False

    # 5. Update appointment status to CANCELLED
    cancel_resp = client.patch(
        f"/api/v1/appointments/{appt_id}/status",
        json={"status": "CANCELLED", "cancellation_reason": "Rescheduled by patient"},
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # 6. Check slot is available again after cancellation
    slots_after_cancel = client.get(
        f"/api/v1/appointments/slots?doctor_id={doc.id}&date=2026-10-15"
    ).json()
    assert slots_after_cancel[0]["is_available"] is True


def test_appointment_listing(client, patient_token, doctor_token, admin_token):
    # Patient lists own appointments
    resp = client.get(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

    # Doctor lists appointments
    resp_doc = client.get(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert resp_doc.status_code == 200
