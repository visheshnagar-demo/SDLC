def test_add_activity_and_recalculate_budget(client):
    itin_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "New York, USA",
            "budget": 1000.0,
            "duration_days": 2,
            "interests": ["Broadway"],
        },
    )
    itin = itin_res.json()
    itin_id = itin["id"]
    day_id = itin["days"][0]["id"]
    initial_cost = itin["total_estimated_cost"]

    act_payload = {
        "day_id": day_id,
        "time_slot": "Evening",
        "title": "Broadway Musical Show",
        "description": "Watch a top musical on Broadway.",
        "category": "Entertainment",
        "estimated_cost": 150.0,
        "location": "Broadway Theater, NYC",
        "duration_minutes": 150,
        "sequence_order": 5,
    }
    act_res = client.post(f"/api/v1/itineraries/{itin_id}/activities", json=act_payload)
    assert act_res.status_code == 201
    act_data = act_res.json()
    assert act_data["title"] == "Broadway Musical Show"
    assert act_data["estimated_cost"] == 150.0

    # Verify updated total cost
    get_itin = client.get(f"/api/v1/itineraries/{itin_id}").json()
    assert get_itin["total_estimated_cost"] == round(initial_cost + 150.0, 2)


def test_update_activity(client):
    itin_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Seoul, South Korea",
            "budget": 1500.0,
            "duration_days": 2,
            "interests": ["K-Pop", "Food"],
        },
    )
    itin = itin_res.json()
    itin_id = itin["id"]
    activity = itin["days"][0]["activities"][0]
    act_id = activity["id"]

    update_payload = {
        "title": "Updated Night Market Food Tour",
        "estimated_cost": 85.0,
        "duration_minutes": 90,
    }
    update_res = client.put(
        f"/api/v1/itineraries/{itin_id}/activities/{act_id}", json=update_payload
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Night Market Food Tour"
    assert update_res.json()["estimated_cost"] == 85.0


def test_delete_activity_and_budget_reduction(client):
    itin_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Rome, Italy",
            "budget": 2000.0,
            "duration_days": 2,
            "interests": ["History"],
        },
    )
    itin = itin_res.json()
    itin_id = itin["id"]
    activity = itin["days"][0]["activities"][0]
    act_id = activity["id"]
    act_cost = activity["estimated_cost"]
    initial_total = itin["total_estimated_cost"]

    del_res = client.delete(f"/api/v1/itineraries/{itin_id}/activities/{act_id}")
    assert del_res.status_code == 200
    summary = del_res.json()
    assert summary["total_estimated_cost"] == round(initial_total - act_cost, 2)
    assert summary["remaining_budget"] == round(
        summary["budget"] - summary["total_estimated_cost"], 2
    )


def test_reorder_activities(client):
    itin_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Berlin, Germany",
            "budget": 1000.0,
            "duration_days": 2,
            "interests": ["History"],
        },
    )
    itin = itin_res.json()
    itin_id = itin["id"]
    day1_id = itin["days"][0]["id"]
    activities = itin["days"][0]["activities"]
    assert len(activities) >= 2

    reorder_payload = {
        "activities": [
            {
                "activity_id": activities[0]["id"],
                "day_id": day1_id,
                "sequence_order": 2,
            },
            {
                "activity_id": activities[1]["id"],
                "day_id": day1_id,
                "sequence_order": 1,
            },
        ]
    }
    reorder_res = client.post(
        f"/api/v1/itineraries/{itin_id}/activities/reorder", json=reorder_payload
    )
    assert reorder_res.status_code == 200


def test_activity_over_budget_status(client):
    itin_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Zurich, Switzerland",
            "budget": 100.0,
            "duration_days": 1,
            "interests": ["Luxury"],
        },
    )
    itin = itin_res.json()
    itin_id = itin["id"]
    day_id = itin["days"][0]["id"]

    # Add very expensive activity
    client.post(
        f"/api/v1/itineraries/{itin_id}/activities",
        json={
            "day_id": day_id,
            "title": "Helicopter Tour of the Alps",
            "estimated_cost": 2500.0,
            "time_slot": "Morning",
            "category": "Adventure",
            "duration_minutes": 120,
            "sequence_order": 10,
        },
    )

    updated_itin = client.get(f"/api/v1/itineraries/{itin_id}").json()
    assert updated_itin["budget_status"] == "OVER_BUDGET"
    assert updated_itin["total_estimated_cost"] > updated_itin["budget"]
