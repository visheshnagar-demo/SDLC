def test_list_feed_rations(client):
    response = client.get("/api/v1/feed-rations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3


def test_create_feed_ration(client):
    payload = {
        "ration_name": "Fresh Heifer Transition TMR",
        "target_group": "Heifers",
        "dry_matter_kg_per_day": 16.5,
        "silage_pct": 55.0,
        "concentrate_pct": 30.0,
        "forage_supplements_pct": 15.0,
    }
    resp = client.post("/api/v1/feed-rations", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["ration_name"] == "Fresh Heifer Transition TMR"
    assert "id" in data


def test_calculate_feed_allocation_dynamic(client):
    # Calculate for high yield cow (32L/day, 620kg body weight, BCS 3.25)
    payload = {
        "lactation_stage": "Early Lactation",
        "daily_milk_yield_liters": 32.0,
        "body_condition_score": 3.25,
        "body_weight_kg": 620.0,
    }
    resp = client.post("/api/v1/feed-rations/calculate-allocation", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["ration_target_group"] == "High Yield"
    assert data["recommended_dry_matter_kg"] > 20.0
    assert data["silage_kg"] > 0
    assert data["concentrate_kg"] > 0

    # Calculate for dry cow
    dry_payload = {
        "lactation_stage": "Dry",
        "daily_milk_yield_liters": 0.0,
        "body_condition_score": 3.5,
        "body_weight_kg": 650.0,
    }
    dry_resp = client.post(
        "/api/v1/feed-rations/calculate-allocation", json=dry_payload
    )
    assert dry_resp.status_code == 200
    dry_data = dry_resp.json()
    assert dry_data["ration_target_group"] == "Dry Cows"


def test_get_cow_feed_allocation(client):
    # Fetch for COW-1042
    cow_resp = client.get("/api/v1/cattle?search=COW-1042")
    assert cow_resp.status_code == 200
    cow_id = cow_resp.json()[0]["id"]

    alloc_resp = client.get(f"/api/v1/feed-rations/cow/{cow_id}/allocation")
    assert alloc_resp.status_code == 200
    data = alloc_resp.json()
    assert data["cow_id"] == cow_id
    assert "recommended_dry_matter_kg" in data


def test_feed_inventory_threshold_and_reorder_alert(client):
    # Daily consumption = 100kg -> 5-day threshold = 500kg
    # Case A: Stock is 400kg (below 500kg) -> reorder_alert MUST be True
    payload_low = {
        "feed_name": "Canola Meal",
        "category": "Concentrate",
        "current_stock_kg": 400.0,
        "daily_consumption_kg": 100.0,
    }
    resp_low = client.post("/api/v1/feed-inventory", json=payload_low)
    assert resp_low.status_code == 201
    data_low = resp_low.json()
    assert data_low["reorder_threshold_kg"] == 500.0
    assert data_low["reorder_alert"] is True

    # Case B: Stock is 1000kg (above 500kg) -> reorder_alert MUST be False
    payload_high = {
        "feed_name": "Barley Grain",
        "category": "Concentrate",
        "current_stock_kg": 1000.0,
        "daily_consumption_kg": 100.0,
    }
    resp_high = client.post("/api/v1/feed-inventory", json=payload_high)
    assert resp_high.status_code == 201
    data_high = resp_high.json()
    assert data_high["reorder_alert"] is False


def test_update_feed_inventory(client):
    list_resp = client.get("/api/v1/feed-inventory")
    assert list_resp.status_code == 200
    items = list_resp.json()
    item_id = items[0]["id"]

    # Replenish stock
    update_payload = {"current_stock_kg": 20000.0}
    upd_resp = client.put(f"/api/v1/feed-inventory/{item_id}", json=update_payload)
    assert upd_resp.status_code == 200
    assert upd_resp.json()["current_stock_kg"] == 20000.0
    assert upd_resp.json()["reorder_alert"] is False
