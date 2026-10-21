def test_list_doctors(client, receptionist_headers):
    response = client.get("/api/v1/doctors", headers=receptionist_headers)
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) >= 1
    assert any(d["doctor_code"] == "DOC-201" for d in doctors)


def test_list_doctors_filtered_by_department(client, receptionist_headers):
    response = client.get(
        "/api/v1/doctors?department=Cardiology", headers=receptionist_headers
    )
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) >= 1
    assert all("Cardiology" in d["department"] for d in doctors)


def test_get_doctor_by_id(client, receptionist_headers):
    doc_res = client.get("/api/v1/doctors", headers=receptionist_headers)
    doctor_id = doc_res.json()[0]["id"]

    response = client.get(f"/api/v1/doctors/{doctor_id}", headers=receptionist_headers)
    assert response.status_code == 200
    assert response.json()["id"] == doctor_id


def test_configure_doctor_schedule(client, doctor_headers):
    doc_res = client.get("/api/v1/doctors", headers=doctor_headers)
    doctor_id = doc_res.json()[0]["id"]

    # Configure schedule for Saturday (day 5)
    schedule_payload = {
        "day_of_week": 5,
        "start_time": "10:00:00",
        "end_time": "14:00:00",
        "is_active": True,
    }
    response = client.post(
        f"/api/v1/doctors/{doctor_id}/schedules",
        json=schedule_payload,
        headers=doctor_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["day_of_week"] == 5
    assert data["doctor_id"] == doctor_id


def test_check_doctor_availability(client, receptionist_headers):
    doc_res = client.get("/api/v1/doctors", headers=receptionist_headers)
    doctor_id = doc_res.json()[0]["id"]

    # 2026-06-01 is a Monday (day 0)
    response = client.get(
        f"/api/v1/doctors/{doctor_id}/availability?date=2026-06-01",
        headers=receptionist_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["doctor_id"] == doctor_id
    assert "available_slots" in data
    assert len(data["available_slots"]) > 0
    assert any(slot["start_time"] == "09:00:00" for slot in data["available_slots"])
