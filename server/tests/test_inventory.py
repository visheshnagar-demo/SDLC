def test_inventory_flow(client):
    res = client.get("/api/v1/inventory/items")
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0

    item = items[0]
    item_id = item["id"]

    # Stock movement IN
    mv_payload = {
        "item_id": item_id,
        "movement_type": "in",
        "quantity": 10.0,
        "unit_price": 50.0,
        "reference_reason": "Fresh stock purchase",
    }
    mv_res = client.post("/api/v1/inventory/movements", json=mv_payload)
    assert mv_res.status_code == 201
    assert mv_res.json()["quantity"] == 10.0

    # Low stock alerts check
    alerts_res = client.get("/api/v1/inventory/alerts")
    assert alerts_res.status_code == 200
