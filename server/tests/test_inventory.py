def test_stock_tracking_and_realtime_updates(client):
    # 1. Create item
    item_res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-SHIPMENT-01",
            "name": "Body Armor",
            "category": "Gear",
            "unit_price": 500.0,
            "reorder_threshold": 10,
            "reorder_quantity": 50,
        },
    )
    assert item_res.status_code == 201
    item_id = item_res.json()["id"]

    # 2. Get main warehouse
    wh_res = client.get("/api/v1/warehouses")
    wh_id = wh_res.json()[0]["id"]

    # 3. Add 50 units
    adj1 = client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "warehouse_id": wh_id,
            "quantity_delta": 50,
            "reason_code": "STOCK_INBOUND",
            "notes": "Initial shipment arrival",
        },
    )
    assert adj1.status_code == 201
    assert adj1.json()["previous_quantity"] == 0
    assert adj1.json()["new_quantity"] == 50

    # 4. Add another 100 units
    adj2 = client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "warehouse_id": wh_id,
            "quantity_delta": 100,
            "reason_code": "STOCK_INBOUND",
            "notes": "Second shipment arrival",
        },
    )
    assert adj2.status_code == 201
    assert adj2.json()["previous_quantity"] == 50
    assert adj2.json()["new_quantity"] == 150

    # 5. Check real-time stock levels
    inv_res = client.get(f"/api/v1/inventory?item_id={item_id}")
    assert inv_res.status_code == 200
    stocks = inv_res.json()
    assert len(stocks) == 1
    assert stocks[0]["quantity_on_hand"] == 150


def test_insufficient_stock_prevention(client):
    item_res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-LIMIT-01",
            "name": "Flashlight",
            "category": "Tools",
            "unit_price": 25.0,
            "reorder_threshold": 5,
            "reorder_quantity": 20,
        },
    )
    item_id = item_res.json()["id"]

    # Try reducing stock by 10 when stock is 0
    adj_fail = client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "quantity_delta": -10,
            "reason_code": "DISPATCH",
        },
    )
    assert adj_fail.status_code == 400
    assert "Insufficient stock" in adj_fail.json()["detail"]


def test_stock_transfer_between_warehouses(client):
    # Create item
    item_res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-TRANSFER-01",
            "name": "Night Vision Goggles",
            "category": "Electronics",
            "unit_price": 1200.0,
            "reorder_threshold": 2,
            "reorder_quantity": 10,
        },
    )
    item_id = item_res.json()["id"]

    # Create two warehouses
    wh1 = client.post(
        "/api/v1/warehouses", json={"code": "WH-A", "name": "Warehouse Alpha"}
    ).json()["id"]
    wh2 = client.post(
        "/api/v1/warehouses", json={"code": "WH-B", "name": "Warehouse Beta"}
    ).json()["id"]

    # Add 20 units to WH-A
    client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "warehouse_id": wh1,
            "quantity_delta": 20,
            "reason_code": "STOCK_INBOUND",
        },
    )

    # Transfer 5 units from WH-A to WH-B
    xfer_res = client.post(
        "/api/v1/inventory/transfer",
        json={
            "item_id": item_id,
            "from_warehouse_id": wh1,
            "to_warehouse_id": wh2,
            "quantity": 5,
            "reason_code": "RELOCATION",
            "notes": "Relocating stock to Beta",
        },
    )
    assert xfer_res.status_code == 201
    data = xfer_res.json()
    assert data["from_warehouse_new_stock"] == 15
    assert data["to_warehouse_new_stock"] == 5
