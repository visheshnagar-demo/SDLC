"""Test suite for Availability profile endpoints."""


def test_get_and_set_availability(client):
    # 1. Get initial availability
    get_res = client.get("/api/v1/availability")
    assert get_res.status_code == 200
    assert isinstance(get_res.json(), list)

    # 2. Update availability profile
    new_schedule = {
        "weekly_slots": [
            {
                "day_of_week": "MONDAY",
                "available_minutes": 240,
                "preferred_time_of_day": "EVENING",
            },
            {
                "day_of_week": "TUESDAY",
                "available_minutes": 180,
                "preferred_time_of_day": "MORNING",
            },
            {
                "day_of_week": "WEDNESDAY",
                "available_minutes": 120,
                "preferred_time_of_day": "AFTERNOON",
            },
            {
                "day_of_week": "SATURDAY",
                "available_minutes": 300,
                "preferred_time_of_day": "MORNING",
            },
        ]
    }
    post_res = client.post("/api/v1/availability", json=new_schedule)
    assert post_res.status_code == 200
    saved_slots = post_res.json()
    assert len(saved_slots) >= 4

    monday_slot = next((s for s in saved_slots if s["day_of_week"] == "MONDAY"), None)
    assert monday_slot is not None
    assert monday_slot["available_minutes"] == 240
    assert monday_slot["preferred_time_of_day"] == "EVENING"
