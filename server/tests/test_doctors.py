def test_list_doctors(client, receptionist_headers):
    response = client.get("/api/v1/doctors", headers=receptionist_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["department"] == "Cardiology"

def test_get_doctor_availability(client, receptionist_headers):
    # Get doctor ID
    docs_res = client.get("/api/v1/doctors", headers=receptionist_headers)
    doc_id = docs_res.json()[0]["id"]

    response = client.get(
        f"/api/v1/doctors/{doc_id}/availability",
        params={"date": "2026-06-01"},
        headers=receptionist_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["doctor_id"] == doc_id
    assert "available_slots" in data
    assert len(data["available_slots"]) > 0

def test_create_doctor_schedule(client, doctor_headers):
    docs_res = client.get("/api/v1/doctors", headers=doctor_headers)
    doc_id = docs_res.json()[0]["id"]

    schedule_payload = {
        "day_of_week": 5,  # Saturday
        "start_time": "10:00:00",
        "end_time": "14:00:00",
        "is_active": True,
    }
    response = client.post(
        f"/api/v1/doctors/{doc_id}/schedules",
        json=schedule_payload,
        headers=doctor_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["day_of_week"] == 5
    assert data["start_time"] == "10:00:00"
