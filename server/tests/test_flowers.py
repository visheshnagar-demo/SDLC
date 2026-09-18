def test_list_flowers(client):
    response = client.get("/api/v1/flowers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_flower(client):
    payload = {
        "name": "Pink Peonies",
        "species": "Paeonia lactiflora",
        "color": "Pink",
        "price_per_stem": 4.50,
        "stock_quantity": 100,
        "low_stock_threshold": 15,
        "freshness_date": "2026-06-01",
        "care_instructions": "Change water daily and trim stems.",
    }
    response = client.post("/api/v1/flowers", json=payload)
    assert response.status_code == 201
    flower = response.json()
    assert flower["name"] == "Pink Peonies"
    assert flower["price_per_stem"] == 4.50
    assert flower["stock_quantity"] == 100


def test_negative_price_validation_error(client):
    payload = {
        "name": "Bad Flower",
        "species": "Bad Species",
        "color": "Black",
        "price_per_stem": -5.00,
        "stock_quantity": 50,
    }
    response = client.post("/api/v1/flowers", json=payload)
    assert response.status_code in (400, 422)


def test_negative_stock_validation_error(client):
    payload = {
        "name": "Bad Stock Flower",
        "species": "Bad Species",
        "color": "Black",
        "price_per_stem": 2.50,
        "stock_quantity": -10,
    }
    response = client.post("/api/v1/flowers", json=payload)
    assert response.status_code in (400, 422)


def test_update_and_delete_flower(client):
    # Create flower
    res = client.post(
        "/api/v1/flowers",
        json={
            "name": "Sunflowers",
            "species": "Helianthus annuus",
            "color": "Yellow",
            "price_per_stem": 2.00,
            "stock_quantity": 80,
        },
    )
    flower_id = res.json()["id"]

    # Update price and stock
    up_res = client.put(
        f"/api/v1/flowers/{flower_id}",
        json={"price_per_stem": 2.25, "stock_quantity": 90},
    )
    assert up_res.status_code == 200
    assert up_res.json()["price_per_stem"] == 2.25
    assert up_res.json()["stock_quantity"] == 90

    # Delete
    del_res = client.delete(f"/api/v1/flowers/{flower_id}")
    assert del_res.status_code == 204

    # Verify 404
    assert client.get(f"/api/v1/flowers/{flower_id}").status_code == 404
