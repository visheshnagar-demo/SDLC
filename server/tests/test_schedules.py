"""Test suite for AI Schedule Generation and Management."""

from datetime import date, timedelta


def test_schedule_generation_and_lifecycle(client):
    # 1. Create test subjects
    today = date.today()
    s1_res = client.post(
        "/api/v1/subjects",
        json={
            "name": "Microeconomics",
            "difficulty_level": 4,
            "target_date": (today + timedelta(days=25)).isoformat(),
            "estimated_total_hours": 30.0,
            "color_tag": "#3B82F6",
        },
    )
    s1_id = s1_res.json()["id"]

    s2_res = client.post(
        "/api/v1/subjects",
        json={
            "name": "Data Structures",
            "difficulty_level": 5,
            "target_date": (today + timedelta(days=15)).isoformat(),
            "estimated_total_hours": 40.0,
            "color_tag": "#EF4444",
        },
    )
    s2_id = s2_res.json()["id"]

    # 2. Set availability
    client.post(
        "/api/v1/availability",
        json={
            "weekly_slots": [
                {
                    "day_of_week": "MONDAY",
                    "available_minutes": 180,
                    "preferred_time_of_day": "EVENING",
                },
                {
                    "day_of_week": "TUESDAY",
                    "available_minutes": 180,
                    "preferred_time_of_day": "EVENING",
                },
                {
                    "day_of_week": "WEDNESDAY",
                    "available_minutes": 180,
                    "preferred_time_of_day": "EVENING",
                },
                {
                    "day_of_week": "THURSDAY",
                    "available_minutes": 180,
                    "preferred_time_of_day": "EVENING",
                },
                {
                    "day_of_week": "FRIDAY",
                    "available_minutes": 120,
                    "preferred_time_of_day": "AFTERNOON",
                },
                {
                    "day_of_week": "SATURDAY",
                    "available_minutes": 240,
                    "preferred_time_of_day": "MORNING",
                },
                {
                    "day_of_week": "SUNDAY",
                    "available_minutes": 240,
                    "preferred_time_of_day": "MORNING",
                },
            ]
        },
    )

    # 3. Generate study plan
    gen_payload = {
        "plan_title": "Fall Midterms Intensive",
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=20)).isoformat(),
        "subject_ids": [s1_id, s2_id],
        "daily_max_minutes": 240,
        "include_recommendations": True,
    }
    gen_res = client.post("/api/v1/schedules/generate", json=gen_payload)
    assert gen_res.status_code == 201
    plan_data = gen_res.json()
    assert plan_data["title"] == "Fall Midterms Intensive"
    assert plan_data["total_study_hours"] > 0
    assert plan_data["sessions_count"] > 0
    assert len(plan_data["priorities"]) == 2

    # Data Structures should have higher priority rank (Rank 1) due to higher difficulty & nearer date
    first_priority = plan_data["priorities"][0]
    assert first_priority["priority_rank"] == 1
    assert first_priority["subject_name"] == "Data Structures"
    plan_id = plan_data["id"]

    # 4. Get detailed schedule
    detail_res = client.get(f"/api/v1/schedules/{plan_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert len(detail_data["sessions"]) == plan_data["sessions_count"]
    first_session = detail_data["sessions"][0]
    assert first_session["status"] == "PENDING"
    assert first_session["duration_minutes"] > 0
    session_id = first_session["id"]

    # 5. Patch session status to COMPLETED
    patch_res = client.patch(
        f"/api/v1/schedules/sessions/{session_id}", json={"status": "COMPLETED"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "COMPLETED"

    # 6. List all schedules
    list_res = client.get("/api/v1/schedules")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 7. Delete schedule
    del_res = client.delete(f"/api/v1/schedules/{plan_id}")
    assert del_res.status_code == 204

    # 8. Verify 404
    get_res = client.get(f"/api/v1/schedules/{plan_id}")
    assert get_res.status_code == 404


def test_generate_schedule_invalid_subjects(client):
    today = date.today()
    gen_payload = {
        "plan_title": "Invalid Subjects Test",
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=7)).isoformat(),
        "subject_ids": ["non-existent-uuid-12345"],
        "daily_max_minutes": 120,
        "include_recommendations": True,
    }
    res = client.post("/api/v1/schedules/generate", json=gen_payload)
    assert res.status_code == 400
