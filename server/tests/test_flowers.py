def test_list_flowers(client):
    response = client.get("/api/v1/flowers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["name"] == "Red Roses"


def test_create_flower_success(client):
    payload = {
        "name": "White Lilies",
        "species": "Lilium candidum",
        "color": "White",
        "price_per_stem": 3.50,
        "stock_quantity": 100,
        "low_stock_threshold": 15,
        "freshness_date": "2026-06-20",
        "care_instructions": "Keep in clean water.",
    }
    response = client.post("/api/v1/flowers", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "White Lilies"
    assert data["price_per_stem"] == 3.50
    assert data["stock_quantity"] == 100


def test_create_flower_negative_price_validation(client):
    payload = {
        "name": "Invalid Flower",
        "species": "Unknown",
        "price_per_stem": -5.00,
        "stock_quantity": 10,
    }
    response = client.post("/api/v1/flowers", json=payload)
    assert response.status_code in [400, 422]


def test_create_flower_negative_stock_validation(client):
    payload = {
        "name": "Invalid Flower 2",
        "species": "Unknown",
        "price_per_stem": 5.00,
        "stock_quantity": -10,
    }
    response = client.post("/api/v1/flowers", json=payload)
    assert response.status_code in [400, 422]


def test_get_and_update_flower(client):
    # Create first
    create_res = client.post(
        "/api/v1/flowers",
        json={
            "name": "Yellow Tulips",
            "species": "Tulipa gesneriana",
            "price_per_stem": 2.00,
            "stock_quantity": 50,
        },
    )
    flower_id = create_res.json()["id"]

    # Get
    get_res = client.get(f"/api/v1/flowers/{flower_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Yellow Tulips"

    # Update
    update_res = client.put(
        f"/api/v1/flowers/{flower_id}",
        json={"price_per_stem": 2.25, "stock_quantity": 60},
    )
    assert update_res.status_code == 200
    assert update_res.json()["price_per_stem"] == 2.25
    assert update_res.json()["stock_quantity"] == 60


def test_delete_flower(client):
    create_res = client.post(
        "/api/v1/flowers",
        json={
            "name": "Temp Flower",
            "species": "Temp Species",
            "price_per_stem": 1.00,
            "stock_quantity": 10,
        },
    )
    flower_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/flowers/{flower_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/v1/flowers/{flower_id}")
    assert get_res.status_code == 404
