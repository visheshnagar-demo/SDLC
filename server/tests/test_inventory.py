def test_stock_adjustment_and_tracking(client):
    # 1. Create an item
    item_res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-INV-101",
            "name": "Body Armor Vest",
            "category": "Gear",
            "unit_price": 500.0,
            "reorder_threshold": 15,
            "reorder_quantity": 40,
        },
    )
    assert item_res.status_code == 201
    item_id = item_res.json()["id"]

    # 2. Get main warehouse ID
    wh_res = client.get("/api/v1/warehouses/WH-MAIN")
    assert wh_res.status_code == 200
    wh_id = wh_res.json()["id"]

    # 3. Add stock shipment (50 units)
    adj_res = client.post(
        "/api/v1/inventory/adjust",
        json={
            "item_id": item_id,
            "warehouse_id": wh_id,
            "quantity": 50,
            "adjustment_type": "add",
            "reason_code": "STOCK_INBOUND",
            "notes": "Initial shipment arrival",
        },
    )
    assert adj_res.status_code == 201
    adj_data = adj_res.json()
    assert adj_data["previous_quantity"] == 0
    assert adj_data["quantity_delta"] == 50
    assert adj_data["new_quantity"] == 50

    # 4. Verify inventory listing
    inv_res = client.get(f"/api/v1/inventory?warehouse_id={wh_id}")
    assert inv_res.status_code == 200
    inv_items = [i for i in inv_res.json() if i["item_id"] == item_id]
    assert len(inv_items) == 1
    assert inv_items[0]["quantity_on_hand"] == 50

    # 5. Record damage (-2 units)
    dmg_res = client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "warehouse_id": wh_id,
            "quantity": 2,
            "adjustment_type": "remove",
            "reason_code": "DAMAGED_GOODS",
            "notes": "Torn vest during inspection",
        },
    )
    assert dmg_res.status_code == 201
    assert dmg_res.json()["previous_quantity"] == 50
    assert dmg_res.json()["new_quantity"] == 48

    # 6. Verify negative stock prevention
    err_res = client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "warehouse_id": wh_id,
            "quantity": 100,
            "adjustment_type": "remove",
            "reason_code": "DISCREPANCY",
        },
    )
    assert err_res.status_code == 422
