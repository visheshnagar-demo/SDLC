def test_place_order_success(client):
    # First get available flower
    flowers = client.get("/api/v1/flowers").json()
    flower = flowers[0]
    initial_stock = flower["stock_quantity"]
    order_qty = 5

    order_payload = {
        "customer_name": "John Smith",
        "customer_email": "john@example.com",
        "customer_phone": "555-1234",
        "notes": "Express delivery",
        "items": [{"flower_id": flower["id"], "quantity": order_qty}],
    }

    response = client.post("/api/v1/orders", json=order_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["customer_name"] == "John Smith"
    assert data["status"] == "Pending"
    assert data["total_amount"] == flower["price_per_stem"] * order_qty
    assert len(data["items"]) == 1

    # Verify stock deduction
    updated_flower = client.get(f"/api/v1/flowers/{flower['id']}").json()
    assert updated_flower["stock_quantity"] == initial_stock - order_qty


def test_place_order_insufficient_stock(client):
    # Create a flower with low stock
    create_res = client.post(
        "/api/v1/flowers",
        json={
            "name": "Rare Orchid",
            "species": "Orchidaceae",
            "price_per_stem": 15.00,
            "stock_quantity": 3,
        },
    )
    flower = create_res.json()

    order_payload = {
        "customer_name": "Jane Doe",
        "items": [
            {
                "flower_id": flower["id"],
                "quantity": 10,  # Exceeds available stock of 3
            }
        ],
    }

    response = client.post("/api/v1/orders", json=order_payload)
    assert response.status_code == 400
    assert "Insufficient Stock" in response.json()["detail"]


def test_get_and_update_order_status(client):
    flowers = client.get("/api/v1/flowers").json()
    flower = flowers[0]

    order_res = client.post(
        "/api/v1/orders",
        json={
            "customer_name": "Alice Brown",
            "items": [{"flower_id": flower["id"], "quantity": 1}],
        },
    )
    order_id = order_res.json()["id"]

    # Get
    get_res = client.get(f"/api/v1/orders/{order_id}")
    assert get_res.status_code == 200
    assert get_res.json()["customer_name"] == "Alice Brown"

    # Update status
    status_res = client.patch(
        f"/api/v1/orders/{order_id}/status", json={"status": "Completed"}
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Completed"
