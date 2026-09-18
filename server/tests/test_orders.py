def test_create_order_success_and_stock_deduction(client):
    # Fetch a flower
    flowers = client.get("/api/v1/flowers").json()
    flower = flowers[0]
    flower_id = flower["id"]
    initial_stock = flower["stock_quantity"]
    price = flower["price_per_stem"]

    order_payload = {
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "customer_phone": "555-1234",
        "notes": "Express delivery",
        "items": [{"flower_id": flower_id, "quantity": 5}],
    }

    response = client.post("/api/v1/orders", json=order_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["customer_name"] == "John Doe"
    assert data["status"] == "Pending"
    assert data["total_amount"] == round(5 * price, 2)
    assert len(data["order_items"]) == 1

    # Verify stock was deducted
    updated_flower = client.get(f"/api/v1/flowers/{flower_id}").json()
    assert updated_flower["stock_quantity"] == initial_stock - 5


def test_create_order_insufficient_stock_error(client):
    flowers = client.get("/api/v1/flowers").json()
    flower = flowers[0]
    flower_id = flower["id"]
    current_stock = flower["stock_quantity"]

    # Request more than available stock
    excessive_qty = current_stock + 100
    order_payload = {
        "customer_name": "Jane Smith",
        "items": [{"flower_id": flower_id, "quantity": excessive_qty}],
    }

    response = client.post("/api/v1/orders", json=order_payload)
    assert response.status_code == 400
    assert "Insufficient Stock" in response.json()["detail"]

    # Verify stock remained unchanged
    check_flower = client.get(f"/api/v1/flowers/{flower_id}").json()
    assert check_flower["stock_quantity"] == current_stock


def test_list_orders(client):
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_order_cancellation_restores_stock(client):
    flowers = client.get("/api/v1/flowers").json()
    flower = flowers[0]
    flower_id = flower["id"]
    initial_stock = flower["stock_quantity"]

    # Create an order of 3 stems
    order_payload = {
        "customer_name": "Alice Green",
        "items": [{"flower_id": flower_id, "quantity": 3}],
    }
    create_res = client.post("/api/v1/orders", json=order_payload)
    order_id = create_res.json()["id"]

    # Verify stock deducted
    flower_after_order = client.get(f"/api/v1/flowers/{flower_id}").json()
    assert flower_after_order["stock_quantity"] == initial_stock - 3

    # Cancel order
    status_update = {"status": "Cancelled"}
    patch_res = client.patch(f"/api/v1/orders/{order_id}/status", json=status_update)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Cancelled"

    # Verify stock restored
    flower_after_cancel = client.get(f"/api/v1/flowers/{flower_id}").json()
    assert flower_after_cancel["stock_quantity"] == initial_stock
