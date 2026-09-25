from datetime import datetime, timezone, timedelta


def test_equipment_lifecycle_and_maintenance_logging(client):
    tank_res = client.post(
        "/api/v1/tanks",
        json={
            "name": "Equipment Life Support Tank",
            "location": "Central Pavilion",
            "capacity_liters": 2000.0,
            "water_type": "Saltwater",
        },
    )
    tank_id = tank_res.json()["id"]

    # 1. Register equipment
    now = datetime.now(timezone.utc)
    eq_payload = {
        "tank_id": tank_id,
        "name": "Heavy Duty Protein Skimmer",
        "equipment_type": "Filter",
        "model_number": "SKIM-9000",
        "maintenance_interval_days": 14,
        "last_serviced_at": (now - timedelta(days=12)).isoformat(),
    }
    res = client.post("/api/v1/equipment", json=eq_payload)
    assert res.status_code == 201
    eq_data = res.json()
    eq_id = eq_data["id"]
    assert eq_data["maintenance_interval_days"] == 14
    assert eq_data["status"] == "MAINTENANCE_DUE"  # 12 days past out of 14 -> due within 2 days

    # 2. List equipment for tank
    list_res = client.get(f"/api/v1/equipment?tank_id={tank_id}")
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    assert any(i["id"] == eq_id for i in items)

    # 3. Log maintenance service
    log_payload = {
        "service_date": now.isoformat(),
        "action_taken": "Cup cleaning and pump rotor inspection",
        "technician_notes": "Cleaned impeller and replaced O-ring.",
        "performed_by": "Senior Technician Dave",
    }
    maint_res = client.post(f"/api/v1/equipment/{eq_id}/maintenance-logs", json=log_payload)
    assert maint_res.status_code == 201
    maint_data = maint_res.json()
    assert maint_data["equipment_id"] == eq_id
    assert maint_data["action_taken"] == log_payload["action_taken"]

    # 4. Verify equipment is now OPERATIONAL with next_due_at updated
    detail_res = client.get(f"/api/v1/equipment/{eq_id}")
    assert detail_res.status_code == 200
    updated_eq = detail_res.json()
    assert updated_eq["status"] == "OPERATIONAL"

    # 5. Retrieve maintenance logs
    logs_res = client.get(f"/api/v1/equipment/{eq_id}/maintenance-logs")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) == 1
    assert logs[0]["performed_by"] == "Senior Technician Dave"
