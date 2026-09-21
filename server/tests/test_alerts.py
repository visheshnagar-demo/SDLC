def test_low_stock_alerts(client):
    # 1. Create item with threshold = 10
    item_res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-ALERT-01",
            "name": "Handcuffs Set",
            "unit_price": 30.0,
            "reorder_threshold": 10,
            "reorder_quantity": 50,
        },
    )
    item_id = item_res.json()["id"]

    # 2. Adjust stock to 8 units (below threshold of 10)
    client.post(
        "/api/v1/inventory/adjust",
        json={
            "item_id": item_id,
            "warehouse_id": "WH-MAIN",
            "quantity_delta": 8,
            "reason_code": "STOCK_INBOUND",
        },
    )

    # 3. Query alerts
    alerts_res = client.get("/api/v1/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()

    matching = [a for a in alerts if a["sku"] == "SKU-ALERT-01"]
    assert len(matching) == 1
    assert matching[0]["current_stock"] == 8
    assert matching[0]["reorder_threshold"] == 10
    assert matching[0]["deficit"] == 2
    assert matching[0]["status"] == "LOW_STOCK"
