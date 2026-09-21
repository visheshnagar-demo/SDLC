def test_feed_inventory_crud(client):
    # Add stock
    res = client.post(
        "/api/v1/feed-inventory",
        json={
            "feed_type": "Layer Mash Premier",
            "quantity_kg": 500.0,
            "reorder_threshold_kg": 100.0,
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["feed_type"] == "Layer Mash Premier"
    assert data["quantity_kg"] == 500.0

    # Get inventory list
    get_res = client.get("/api/v1/feed-inventory")
    assert get_res.status_code == 200
    assert any(i["feed_type"] == "Layer Mash Premier" for i in get_res.json())


def test_feed_log_consumption_success_and_insufficient_error(client):
    # Setup flock
    flock_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Feed Flock",
            "breed": "Rhode Island Red",
            "hatch_date": "2025-01-10",
            "initial_count": 500,
            "coop_location": "Coop #1",
        },
    )
    flock_id = flock_res.json()["id"]

    # Setup feed inventory with 100 kg stock
    feed_res = client.post(
        "/api/v1/feed-inventory",
        json={
            "feed_type": "Starter Feed Alpha",
            "quantity_kg": 100.0,
            "reorder_threshold_kg": 50.0,
        },
    )
    feed_id = feed_res.json()["id"]

    # Consume 60 kg (leaves 40 kg -> triggers low stock alert < 50)
    log_res = client.post(
        "/api/v1/feed-logs",
        json={
            "flock_id": flock_id,
            "feed_id": feed_id,
            "quantity_used_kg": 60.0,
            "log_date": "2026-05-18",
        },
    )
    assert log_res.status_code == 201
    log_data = log_res.json()
    assert log_data["quantity_used_kg"] == 60.0
    assert log_data["remaining_feed_stock_kg"] == 40.0
    assert log_data["low_stock_alert"] is True

    # Attempt to consume 50 kg when only 40 kg left -> Insufficient stock 400
    fail_res = client.post(
        "/api/v1/feed-logs",
        json={
            "flock_id": flock_id,
            "feed_id": feed_id,
            "quantity_used_kg": 50.0,
            "log_date": "2026-05-18",
        },
    )
    assert fail_res.status_code == 400
    assert "Insufficient Feed Stock in Inventory" in fail_res.json()["detail"]


def test_list_feed_logs(client):
    flock_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Feed Log Flock",
            "breed": "Leghorn",
            "hatch_date": "2025-01-10",
            "initial_count": 100,
            "coop_location": "Coop #2",
        },
    )
    flock_id = flock_res.json()["id"]

    feed_res = client.post(
        "/api/v1/feed-inventory",
        json={
            "feed_type": "Finisher Feed Beta",
            "quantity_kg": 200.0,
            "reorder_threshold_kg": 50.0,
        },
    )
    feed_id = feed_res.json()["id"]

    client.post(
        "/api/v1/feed-logs",
        json={
            "flock_id": flock_id,
            "feed_id": feed_id,
            "quantity_used_kg": 20.0,
            "log_date": "2026-05-18",
        },
    )

    list_res = client.get(f"/api/v1/feed-logs?flock_id={flock_id}")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
