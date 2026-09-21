def test_low_stock_alerts_trigger(client):
    # 1. Create item with threshold 10
    item_res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-ALERT-9901",
            "name": "First Aid Kit",
            "category": "Medical",
            "unit_price": 40.0,
            "reorder_threshold": 10,
            "reorder_quantity": 50,
        },
    )
    item_id = item_res.json()["id"]

    # 2. Add 15 units (above threshold 10)
    client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "quantity_delta": 15,
            "reason_code": "STOCK_INBOUND",
        },
    )

    # Check alerts -> shouldn't include SKU-ALERT-9901
    alerts_res1 = client.get("/api/v1/alerts")
    assert alerts_res1.status_code == 200
    alert_skus1 = [a["sku"] for a in alerts_res1.json()]
    assert "SKU-ALERT-9901" not in alert_skus1

    # 3. Reduce stock by 6 -> current stock = 9 (below threshold 10)
    client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "quantity_delta": -6,
            "reason_code": "DISPATCH",
        },
    )

    # 4. Check alerts -> SHOULD include SKU-ALERT-9901
    alerts_res2 = client.get("/api/v1/alerts")
    assert alerts_res2.status_code == 200
    alerts2 = alerts_res2.json()
    matching_alert = next((a for a in alerts2 if a["sku"] == "SKU-ALERT-9901"), None)
    assert matching_alert is not None
    assert matching_alert["current_stock"] == 9
    assert matching_alert["reorder_threshold"] == 10
    assert matching_alert["deficit"] == 1
    assert matching_alert["status"] in ("LOW_STOCK", "CRITICAL")
