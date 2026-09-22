def test_checkout_success(client, auth_headers_customer):
    list_resp = client.get("/api/v1/watches?brand=Cartier")
    watch = list_resp.json()["items"][0]
    watch_id = watch["id"]
    watch_price = watch["price"]

    # Checkout
    checkout_resp = client.post(
        "/api/v1/orders/checkout",
        headers=auth_headers_customer,
        json={
            "watch_id": watch_id,
            "shipping_tier": "Malca-Amit Priority Secure",
            "shipping_address": {
                "street_address": "450 Park Avenue, Suite 2800",
                "city": "New York",
                "state": "NY",
                "postal_code": "10022",
                "country": "United States",
            },
        },
    )
    assert checkout_resp.status_code == 201
    order = checkout_resp.json()
    assert order["watch_id"] == watch_id
    assert order["total_amount"] == watch_price
    assert order["shipping_fee"] == 0.0
    assert order["payment_status"] == "PAID"
    assert order["fulfillment_status"] == "PENDING_VERIFICATION"
    assert "order_number" in order
    assert "tracking_number" in order
    assert "handover_pin" in order

    # Watch should now be SOLD
    watch_resp = client.get(f"/api/v1/watches/{watch_id}")
    assert watch_resp.json()["status"] == "SOLD"


def test_checkout_with_armored_express(client, auth_headers_customer):
    list_resp = client.get("/api/v1/watches?brand=Breitling")
    watch = list_resp.json()["items"][0]
    watch_id = watch["id"]
    watch_price = watch["price"]

    checkout_resp = client.post(
        "/api/v1/orders/checkout",
        headers=auth_headers_customer,
        json={
            "watch_id": watch_id,
            "shipping_tier": "Ferrari Group Armored Express",
            "shipping_address": {
                "street_address": "740 Park Avenue",
                "city": "New York",
                "state": "NY",
                "postal_code": "10021",
                "country": "United States",
            },
        },
    )
    assert checkout_resp.status_code == 201
    order = checkout_resp.json()
    assert order["shipping_fee"] == 150.0
    assert order["total_amount"] == watch_price + 150.0
    assert "Ferrari" in order["courier_name"]
    assert order["tracking_number"].startswith("FG-")


def test_cannot_checkout_sold_watch(client, auth_headers_customer):
    list_resp = client.get("/api/v1/watches?brand=Patek")
    watch_id = list_resp.json()["items"][0]["id"]

    # First checkout
    client.post(
        "/api/v1/orders/checkout",
        headers=auth_headers_customer,
        json={"watch_id": watch_id, "shipping_tier": "Malca-Amit Priority Secure"},
    )

    # Second checkout on same watch
    response = client.post(
        "/api/v1/orders/checkout",
        headers=auth_headers_customer,
        json={"watch_id": watch_id, "shipping_tier": "Malca-Amit Priority Secure"},
    )
    assert response.status_code == 400
    assert "already been acquired" in response.json()["detail"].lower()


def test_list_and_get_order(client, auth_headers_customer):
    # Place order
    list_resp = client.get("/api/v1/watches?brand=Audemars")
    watch_id = list_resp.json()["items"][0]["id"]

    create_resp = client.post(
        "/api/v1/orders/checkout",
        headers=auth_headers_customer,
        json={"watch_id": watch_id, "shipping_tier": "Malca-Amit Priority Secure"},
    )
    order_id = create_resp.json()["id"]

    # List orders
    list_orders_resp = client.get("/api/v1/orders", headers=auth_headers_customer)
    assert list_orders_resp.status_code == 200
    orders = list_orders_resp.json()
    assert len(orders) >= 1
    assert any(o["id"] == order_id for o in orders)

    # Get single order
    get_order_resp = client.get(
        f"/api/v1/orders/{order_id}", headers=auth_headers_customer
    )
    assert get_order_resp.status_code == 200
    assert get_order_resp.json()["id"] == order_id


def test_admin_update_order_status(client, auth_headers_customer, auth_headers_admin):
    # Customer places order
    list_resp = client.get("/api/v1/watches?brand=Rolex")
    watch_id = list_resp.json()["items"][0]["id"]

    create_resp = client.post(
        "/api/v1/orders/checkout",
        headers=auth_headers_customer,
        json={"watch_id": watch_id, "shipping_tier": "Ferrari Group Armored Express"},
    )
    order_id = create_resp.json()["id"]

    # Admin updates status to COURIER_DISPATCH
    patch_resp = client.patch(
        f"/api/v1/orders/{order_id}/status",
        headers=auth_headers_admin,
        json={
            "fulfillment_status": "COURIER_DISPATCH",
            "tracking_number": "FG-709-DISPATCHED",
        },
    )
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["fulfillment_status"] == "COURIER_DISPATCH"
    assert updated["tracking_number"] == "FG-709-DISPATCHED"
