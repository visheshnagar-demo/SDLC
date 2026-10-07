def test_list_and_filter_doctors(client):
    # List all doctors
    resp = client.get("/api/v1/doctors")
    assert resp.status_code == 200
    doctors = resp.json()
    assert isinstance(doctors, list)
    assert len(doctors) >= 2

    # Filter by department
    cardio_resp = client.get("/api/v1/doctors?department=Cardiology")
    assert cardio_resp.status_code == 200
    cardio_docs = cardio_resp.json()
    assert len(cardio_docs) >= 1
    assert cardio_docs[0]["department"] == "Cardiology"

    # Get specific doctor
    doc_id = cardio_docs[0]["id"]
    get_doc_resp = client.get(f"/api/v1/doctors/{doc_id}")
    assert get_doc_resp.status_code == 200
    assert get_doc_resp.json()["id"] == doc_id


def test_create_doctor_admin_only(client, admin_token, patient_token):
    # Register a new staff user
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "dr.pediatric@example.com",
            "password": "doctorpassword",
            "full_name": "Dr. Emily Green",
            "role": "DOCTOR",
        },
    )
    assert reg_resp.status_code == 201
    user_id = reg_resp.json()["id"]

    # Patient cannot create doctor profile
    forbidden_resp = client.post(
        "/api/v1/doctors",
        json={
            "user_id": user_id,
            "department": "Pediatrics",
            "specialization": "Pediatrician",
            "consultation_fee": 120.0,
        },
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert forbidden_resp.status_code == 403

    # Admin can create doctor profile
    create_resp = client.post(
        "/api/v1/doctors",
        json={
            "user_id": user_id,
            "department": "Pediatrics",
            "specialization": "Pediatrician",
            "consultation_fee": 120.0,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_resp.status_code == 201
    assert create_resp.json()["department"] == "Pediatrics"
