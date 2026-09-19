import datetime


def test_list_schedules(client, operator_headers):
    response = client.get("/api/v1/schedules", headers=operator_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_schedule_and_conflict(client, manager_headers):
    channels = client.get("/api/v1/channels", headers=manager_headers).json()
    programs = client.get("/api/v1/programs", headers=manager_headers).json()
    channel_id = channels[0]["id"]
    program_id = programs[0]["id"]

    now = datetime.datetime.now(datetime.timezone.utc)
    start_time = (now + datetime.timedelta(hours=10)).isoformat()
    end_time = (now + datetime.timedelta(hours=11)).isoformat()

    payload = {
        "channel_id": channel_id,
        "program_id": program_id,
        "start_time": start_time,
        "end_time": end_time,
        "status": "SCHEDULED",
        "notes": "Test slot",
    }
    response = client.post("/api/v1/schedules", json=payload, headers=manager_headers)
    assert response.status_code == 201
    created_slot = response.json()
    assert created_slot["status"] == "SCHEDULED"

    # Try creating overlapping slot on same channel -> should fail with 400
    overlap_payload = {
        "channel_id": channel_id,
        "program_id": program_id,
        "start_time": (now + datetime.timedelta(hours=10, minutes=30)).isoformat(),
        "end_time": (now + datetime.timedelta(hours=11, minutes=30)).isoformat(),
        "status": "SCHEDULED",
    }
    overlap_resp = client.post(
        "/api/v1/schedules", json=overlap_payload, headers=manager_headers
    )
    assert overlap_resp.status_code == 400
    assert "Time conflict" in overlap_resp.json()["detail"]


def test_emergency_override(client, operator_headers):
    schedules = client.get("/api/v1/schedules", headers=operator_headers).json()
    schedule_id = schedules[0]["id"]

    override_payload = {
        "title": "BREAKING: Earthquake In Region",
        "description": "7.2 magnitude earthquake reported. Interrupting normal programming.",
    }
    response = client.post(
        f"/api/v1/schedules/{schedule_id}/override",
        json=override_payload,
        headers=operator_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "BREAKING: Earthquake In Region"
    assert data["is_active"] is True
