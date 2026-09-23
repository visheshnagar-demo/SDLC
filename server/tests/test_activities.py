def test_add_activity_and_recalculate_budget(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Barcelona, Spain",
            "budget": 1000.0,
            "currency": "EUR",
            "duration_days": 2,
            "interests": ["Food", "Culture"],
        },
    )
    assert create_res.status_code == 201
    itin = create_res.json()
    itin_id = itin["id"]
    day_id = itin["days"][0]["id"]
    initial_cost = itin["total_estimated_cost"]

    # Add custom activity
    add_res = client.post(
        f"/api/v1/itineraries/{itin_id}/activities",
        json={
            "day_id": day_id,
            "time_slot": "18:00 - 19:30",
            "title": "Flamenco Show",
            "description": "Evening live performance with tapas",
            "category": "Culture",
            "estimated_cost": 75.0,
            "location": "Gothic Quarter",
            "duration_minutes": 90,
            "sequence_order": 5,
        },
    )
    assert add_res.status_code == 201
    act_data = add_res.json()
    assert act_data["title"] == "Flamenco Show"
    assert act_data["estimated_cost"] == 75.0

    # Verify updated itinerary total
    updated_itin = client.get(f"/api/v1/itineraries/{itin_id}").json()
    assert round(updated_itin["total_estimated_cost"], 2) == round(
        initial_cost + 75.0, 2
    )


def test_update_activity(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Berlin, Germany",
            "budget": 800.0,
            "currency": "EUR",
            "duration_days": 2,
            "interests": ["History"],
        },
    )
    itin = create_res.json()
    itin_id = itin["id"]
    day = itin["days"][0]
    act = day["activities"][0]
    act_id = act["id"]
    old_cost = act["estimated_cost"]
    new_cost = old_cost + 50.0

    update_res = client.put(
        f"/api/v1/itineraries/{itin_id}/activities/{act_id}",
        json={"title": "Updated Museum Tour", "estimated_cost": new_cost},
    )
    assert update_res.status_code == 200
    updated_act = update_res.json()
    assert updated_act["title"] == "Updated Museum Tour"
    assert updated_act["estimated_cost"] == new_cost


def test_delete_activity_and_budget_reduction(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Amsterdam, Netherlands",
            "budget": 900.0,
            "currency": "EUR",
            "duration_days": 2,
            "interests": ["Culture"],
        },
    )
    itin = create_res.json()
    itin_id = itin["id"]
    day = itin["days"][0]
    act = day["activities"][0]
    act_id = act["id"]
    act_cost = act["estimated_cost"]
    initial_total = itin["total_estimated_cost"]

    del_res = client.delete(f"/api/v1/itineraries/{itin_id}/activities/{act_id}")
    assert del_res.status_code == 200
    summary = del_res.json()
    assert "total_estimated_cost" in summary
    assert "remaining_budget" in summary

    # Verify budget reduced
    updated_itin = client.get(f"/api/v1/itineraries/{itin_id}").json()
    assert round(updated_itin["total_estimated_cost"], 2) == round(
        initial_total - act_cost, 2
    )


def test_reorder_activities(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Vienna, Austria",
            "budget": 1000.0,
            "currency": "EUR",
            "duration_days": 1,
            "interests": ["Culture"],
        },
    )
    itin = create_res.json()
    itin_id = itin["id"]
    activities = itin["days"][0]["activities"]
    assert len(activities) >= 2

    # Swap sequence order
    reorder_payload = {
        "activities": [
            {"activity_id": activities[0]["id"], "sequence_order": 1},
            {"activity_id": activities[1]["id"], "sequence_order": 0},
        ]
    }
    reorder_res = client.post(
        f"/api/v1/itineraries/{itin_id}/activities/reorder", json=reorder_payload
    )
    assert reorder_res.status_code == 200
    reordered_itin = reorder_res.json()
    assert "days" in reordered_itin


def test_activity_over_budget_status(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Zurich, Switzerland",
            "budget": 100.0,
            "currency": "CHF",
            "duration_days": 1,
            "interests": ["Adventure"],
        },
    )
    itin = create_res.json()
    itin_id = itin["id"]
    day_id = itin["days"][0]["id"]

    # Add an expensive activity to exceed budget
    client.post(
        f"/api/v1/itineraries/{itin_id}/activities",
        json={
            "day_id": day_id,
            "time_slot": "14:00 - 18:00",
            "title": "Helicopter Alpine Tour",
            "category": "Adventure",
            "estimated_cost": 500.0,
            "location": "Alps",
        },
    )

    updated_itin = client.get(f"/api/v1/itineraries/{itin_id}").json()
    assert updated_itin["total_estimated_cost"] > updated_itin["budget"]
    assert updated_itin["budget_status"] == "OVER_BUDGET"
