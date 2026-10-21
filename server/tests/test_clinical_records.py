def test_tc07_clinical_consultation_notes_and_status(client, doctor_headers, receptionist_headers):
    # 1. Create appointment as receptionist
    docs = client.get("/api/v1/doctors", headers=receptionist_headers).json()
    patients = client.get("/api/v1/patients", headers=receptionist_headers).json()
    doc_id = docs[0]["id"]
    pat_id = patients[0]["id"]

    apt_payload = {
        "doctor_id": doc_id,
        "patient_id": pat_id,
        "scheduled_start": "2026-06-02T11:00:00",
        "reason_for_visit": "Persistent headache",
    }
    apt_res = client.post("/api/v1/appointments", json=apt_payload, headers=receptionist_headers)
    assert apt_res.status_code == 201
    apt_id = apt_res.json()["id"]

    # 2. Add clinical record as doctor
    record_payload = {
        "symptoms": "Throbbing headache and dizziness",
        "diagnosis": "Tension Headache",
        "prescription": "Ibuprofen 400mg twice daily for 5 days",
        "notes": "Patient advised to reduce screen time and stay hydrated",
        "follow_up_date": "2026-06-15",
    }
    rec_res = client.post(
        f"/api/v1/appointments/{apt_id}/records",
        json=record_payload,
        headers=doctor_headers,
    )
    assert rec_res.status_code == 201
    rec_data = rec_res.json()
    assert rec_data["diagnosis"] == "Tension Headache"
    assert rec_data["prescription"] == "Ibuprofen 400mg twice daily for 5 days"
    assert rec_data["appointment_id"] == apt_id

    # 3. Check appointment status transitioned to COMPLETED
    apt_check = client.get(f"/api/v1/appointments/{apt_id}", headers=doctor_headers)
    assert apt_check.status_code == 200
    assert apt_check.json()["status"] == "COMPLETED"

def test_get_clinical_record(client, doctor_headers):
    # Retrieve clinical record
    appointments = client.get("/api/v1/appointments", headers=doctor_headers).json()
    completed_apts = [a for a in appointments if a["status"] == "COMPLETED"]
    assert len(completed_apts) > 0
    apt_id = completed_apts[0]["id"]

    response = client.get(f"/api/v1/appointments/{apt_id}/records", headers=doctor_headers)
    assert response.status_code == 200
    data = response.json()
    assert "diagnosis" in data
    assert "prescription" in data

def test_receptionist_blocked_from_clinical_record(client, receptionist_headers):
    appointments = client.get("/api/v1/appointments", headers=receptionist_headers).json()
    completed_apts = [a for a in appointments if a["status"] == "COMPLETED"]
    assert len(completed_apts) > 0
    apt_id = completed_apts[0]["id"]

    response = client.get(f"/api/v1/appointments/{apt_id}/records", headers=receptionist_headers)
    assert response.status_code == 403
