def test_feeding_schedule_and_logging_flow(client):
    # Create tank
    tank_res = client.post(
        "/api/v1/tanks",
        json={
            "name": "Feeding Station Tank",
            "location": "North Wing",
            "capacity_liters": 750.0,
            "water_type": "Freshwater",
        },
    )
    tank_id = tank_res.json()["id"]

    # 1. Create feeding schedule
    sched_payload = {
        "tank_id": tank_id,
        "food_type": "Spirulina Flakes",
        "portion_grams": 20.0,
        "frequency": "Daily",
        "scheduled_time": "08:00",
        "is_active": True,
    }
    sched_res = client.post("/api/v1/feeding/schedules", json=sched_payload)
    assert sched_res.status_code == 201
    sched_data = sched_res.json()
    assert sched_data["portion_grams"] == 20.0
    schedule_id = sched_data["id"]

    # 2. Get feeding schedules
    list_sched_res = client.get(f"/api/v1/feeding/schedules?tank_id={tank_id}")
    assert list_sched_res.status_code == 200
    schedules = list_sched_res.json()
    assert len(schedules) == 1

    # 3. Record feeding log
    log_payload = {
        "tank_id": tank_id,
        "schedule_id": schedule_id,
        "food_type": "Spirulina Flakes",
        "portion_grams": 20.0,
        "fed_by": "Alex Morgan",
        "notes": "Morning feeding routine executed normally.",
    }
    log_res = client.post("/api/v1/feeding/logs", json=log_payload)
    assert log_res.status_code == 201
    log_data = log_res.json()
    assert log_data["fed_by"] == "Alex Morgan"
    assert log_data["portion_grams"] == 20.0

    # 4. Get feeding logs
    logs_res = client.get(f"/api/v1/feeding/logs?tank_id={tank_id}")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 1
    assert any(l["fed_by"] == "Alex Morgan" for l in logs)

    # 5. Delete schedule
    del_res = client.delete(f"/api/v1/feeding/schedules/{schedule_id}")
    assert del_res.status_code == 204
