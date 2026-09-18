def test_create_order_calculates_total_and_deducts_stock(client):
    # Get initial flowers
    flowers_res = client.get("/api/v1/flowers")
    flowers = flowers_res.json()
    red_rose = next(f for f in flowers if f["name"] == "Red Roses")
    initial_stock = red_rose["stock_quantity"]

    order_payload = {
        "customer_name": "Alice Smith",
        "customer_email": "alice@example.com",
        "customer_phone": "555-1234",
        "items": [{"flower_id": red_rose["id"], "quantity": 12}],
        "notes": "Deliver by 2 PM",
    }

    res = client.post("/api/v1/orders", json=order_payload)
    assert res.status_code == 201
    order = res.json()
    assert order["customer_name"] == "Alice Smith"
    assert order["status"] == "Pending"
    assert order["total_amount"] == 12 * red_rose["price_per_stem"]
    assert len(order["items"]) == 1

    # Verify stock deduction
    updated_rose_res = client.get(f"/api/v1/flowers/{red_rose['id']}")
    updated_rose = updated_rose_res.json()
    assert updated_rose["stock_quantity"] == initial_stock - 12


def test_insufficient_stock_error(client):
    # Get flower
    flowers_res = client.get("/api/v1/flowers")
    flower = flowers_res.json()[0]
    stock = flower["stock_quantity"]

    order_payload = {
        "customer_name": "Bob Jones",
        "items": [
            {
                "flower_id": flower["id"],
                "quantity": stock + 1000,  # Exceeds available stock
            }
        ],
    }

    res = client.post("/api/v1/orders", json=order_payload)
    assert res.status_code == 400
    assert "Insufficient Stock" in res.json()["detail"]


def test_update_order_status(client):
    # Get flower
    flower = client.get("/api/v1/flowers").json()[0]
    order_payload = {
        "customer_name": "Charlie Brown",
        "items": [{"flower_id": flower["id"], "quantity": 1}],
    }
    order = client.post("/api/v1/orders", json=order_payload).json()
    order_id = order["id"]

    # Patch status to Processing
    patch_res = client.patch(
        f"/api/v1/orders/{order_id}/status", json={"status": "Processing"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Processing"

    # Patch status to Completed
    patch_res2 = client.patch(
        f"/api/v1/orders/{order_id}/status", json={"status": "Completed"}
    )
    assert patch_res2.status_code == 200
    assert patch_res2.json()["status"] == "Completed"
