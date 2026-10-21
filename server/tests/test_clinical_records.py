def test_create_clinical_record_as_doctor(client, doctor_headers):
    # Fetch existing appointment
    list_res = client.get("/api/v1/appointments", headers=doctor_headers)
    appointment_id = list_res.json()["items"][0]["id"]

    record_payload = {
        "symptoms": "Occasional chest tightness after exercise",
        "diagnosis": "Stage 1 Essential Hypertension (ICD-10: I10)",
        "prescription": "Amlodipine 5mg once daily oral, Lisinopril 10mg morning",
        "notes": "Patient advised to reduce sodium intake and maintain blood pressure log.",
        "follow_up_date": "2026-07-01",
    }
    response = client.post(
        f"/api/v1/appointments/{appointment_id}/records",
        json=record_payload,
        headers=doctor_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["appointment_id"] == appointment_id
    assert "Hypertension" in data["diagnosis"]
    assert "Amlodipine" in data["prescription"]

    # Verify appointment status transitioned to COMPLETED
    appt_res = client.get(
        f"/api/v1/appointments/{appointment_id}", headers=doctor_headers
    )
    assert appt_res.status_code == 200
    assert appt_res.json()["status"] == "COMPLETED"


def test_receptionist_forbidden_from_clinical_records(client, receptionist_headers):
    list_res = client.get("/api/v1/appointments", headers=receptionist_headers)
    appointment_id = list_res.json()["items"][0]["id"]

    # Receptionist trying to view clinical records must receive 403 Forbidden
    response = client.get(
        f"/api/v1/appointments/{appointment_id}/records", headers=receptionist_headers
    )
    assert response.status_code == 403
    assert (
        "not authorized" in response.json()["detail"].lower()
        or "forbidden" in response.json()["detail"].lower()
    )


def test_get_clinical_record_as_doctor_or_admin(client, doctor_headers, admin_headers):
    list_res = client.get("/api/v1/appointments", headers=doctor_headers)
    appointment_id = list_res.json()["items"][0]["id"]

    # Doctor access
    doc_res = client.get(
        f"/api/v1/appointments/{appointment_id}/records", headers=doctor_headers
    )
    assert doc_res.status_code == 200
    assert "Hypertension" in doc_res.json()["diagnosis"]

    # Admin access
    admin_res = client.get(
        f"/api/v1/appointments/{appointment_id}/records", headers=admin_headers
    )
    assert admin_res.status_code == 200
    assert "Hypertension" in admin_res.json()["diagnosis"]
