def test_create_item(client):
    payload = {
        "sku": "SKU-9901",
        "name": "Tactical Vest",
        "category": "Gear",
        "unit_price": 150.00,
        "reorder_threshold": 10,
        "reorder_quantity": 50,
    }
    response = client.post("/api/v1/items", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["sku"] == "SKU-9901"
    assert data["name"] == "Tactical Vest"
    assert data["reorder_threshold"] == 10
    assert "id" in data


def test_create_duplicate_sku(client):
    payload = {
        "sku": "SKU-DUP-01",
        "name": "Handcuffs",
        "category": "Equipment",
        "unit_price": 45.00,
        "reorder_threshold": 5,
        "reorder_quantity": 20,
    }
    res1 = client.post("/api/v1/items", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/items", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_list_items(client):
    response = client.get("/api/v1/items?category=Gear")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert any(item["sku"] == "SKU-9901" for item in items)


def test_get_and_update_item(client):
    # Create item
    payload = {
        "sku": "SKU-UPDATE-01",
        "name": "Radio Device",
        "category": "Electronics",
        "unit_price": 200.00,
        "reorder_threshold": 15,
        "reorder_quantity": 30,
    }
    res_create = client.post("/api/v1/items", json=payload)
    item_id = res_create.json()["id"]

    # Get by ID
    res_get = client.get(f"/api/v1/items/{item_id}")
    assert res_get.status_code == 200
    assert res_get.json()["sku"] == "SKU-UPDATE-01"

    # Get by SKU
    res_sku = client.get("/api/v1/items/SKU-UPDATE-01")
    assert res_sku.status_code == 200

    # Update
    update_payload = {"name": "Radio Device v2", "reorder_threshold": 20}
    res_update = client.put(f"/api/v1/items/{item_id}", json=update_payload)
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Radio Device v2"
    assert res_update.json()["reorder_threshold"] == 20


def test_delete_item(client):
    payload = {
        "sku": "SKU-DEL-01",
        "name": "Temporary Item",
        "category": "Misc",
        "unit_price": 10.00,
        "reorder_threshold": 2,
        "reorder_quantity": 5,
    }
    res_create = client.post("/api/v1/items", json=payload)
    item_id = res_create.json()["id"]

    res_del = client.delete(f"/api/v1/items/{item_id}")
    assert res_del.status_code == 204

    res_get = client.get(f"/api/v1/items/{item_id}")
    assert res_get.status_code == 404
