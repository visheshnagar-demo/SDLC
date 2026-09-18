def test_list_flowers(client):
    response = client.get("/api/v1/flowers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3


def test_create_flower_success(client):
    # Get a category and supplier first
    cat_res = client.get("/api/v1/categories")
    cat_id = cat_res.json()[0]["id"]
    sup_res = client.get("/api/v1/suppliers")
    sup_id = sup_res.json()[0]["id"]

    payload = {
        "name": "Sunflowers",
        "species": "Helianthus annuus",
        "color": "Yellow",
        "price_per_stem": 2.00,
        "stock_quantity": 200,
        "low_stock_threshold": 15,
        "care_instructions": "Keep in bright light",
        "category_id": cat_id,
        "supplier_id": sup_id,
    }
    response = client.post("/api/v1/flowers", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Sunflowers"
    assert data["price_per_stem"] == 2.00
    assert data["stock_quantity"] == 200
    assert "id" in data


def test_create_flower_negative_price_or_stock_error(client):
    # Negative price
    payload_price = {
        "name": "Invalid Flower 1",
        "price_per_stem": -2.50,
        "stock_quantity": 100,
    }
    res_price = client.post("/api/v1/flowers", json=payload_price)
    assert res_price.status_code == 422

    # Negative stock
    payload_stock = {
        "name": "Invalid Flower 2",
        "price_per_stem": 2.50,
        "stock_quantity": -10,
    }
    res_stock = client.post("/api/v1/flowers", json=payload_stock)
    assert res_stock.status_code == 422


def test_get_flower_by_id(client):
    flowers = client.get("/api/v1/flowers").json()
    flower_id = flowers[0]["id"]

    response = client.get(f"/api/v1/flowers/{flower_id}")
    assert response.status_code == 200
    assert response.json()["id"] == flower_id


def test_update_flower(client):
    flowers = client.get("/api/v1/flowers").json()
    flower_id = flowers[0]["id"]

    update_payload = {"price_per_stem": 3.00, "stock_quantity": 450}
    response = client.put(f"/api/v1/flowers/{flower_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["price_per_stem"] == 3.00
    assert data["stock_quantity"] == 450


def test_delete_flower(client):
    # Create temporary flower to delete
    payload = {"name": "Temp Flower", "price_per_stem": 1.00, "stock_quantity": 10}
    create_res = client.post("/api/v1/flowers", json=payload)
    flower_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/flowers/{flower_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/v1/flowers/{flower_id}")
    assert get_res.status_code == 404
