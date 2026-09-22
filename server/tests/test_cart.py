from server.auth import create_access_token
from server.models import User
from server.auth import hash_password


def test_reserve_watch_success(client, auth_headers_customer):
    list_resp = client.get("/api/v1/watches?brand=Omega")
    watch_id = list_resp.json()["items"][0]["id"]

    response = client.post(
        "/api/v1/cart/reserve",
        headers=auth_headers_customer,
        json={"watch_id": watch_id},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["watch_id"] == watch_id
    assert data["status"] == "RESERVED"
    assert data["seconds_remaining"] > 0
    assert "expires_at" in data


def test_reserve_watch_collision_concurrency_lock(
    client, auth_headers_customer, db_session
):
    # Get a watch
    list_resp = client.get("/api/v1/watches?brand=Rolex")
    watch_id = list_resp.json()["items"][0]["id"]

    # Customer 1 reserves watch
    res1 = client.post(
        "/api/v1/cart/reserve",
        headers=auth_headers_customer,
        json={"watch_id": watch_id},
    )
    assert res1.status_code == 200

    # Create Customer 2
    user2 = User(
        email="buyer2@luxury.com",
        hashed_password=hash_password("password123"),
        full_name="Collector Two",
        role="customer",
    )
    db_session.add(user2)
    db_session.commit()
    db_session.refresh(user2)

    token2 = create_access_token(
        data={"sub": user2.id, "email": user2.email, "role": user2.role}
    )
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Customer 2 attempts to reserve the same watch
    res2 = client.post(
        "/api/v1/cart/reserve", headers=headers2, json={"watch_id": watch_id}
    )
    assert res2.status_code == 409
    assert "currently held" in res2.json()["detail"].lower()


def test_release_reservation(client, auth_headers_customer):
    list_resp = client.get("/api/v1/watches?brand=Cartier")
    watch_id = list_resp.json()["items"][0]["id"]

    # Reserve
    client.post(
        "/api/v1/cart/reserve",
        headers=auth_headers_customer,
        json={"watch_id": watch_id},
    )

    # Release
    del_resp = client.delete(
        f"/api/v1/cart/reserve/{watch_id}", headers=auth_headers_customer
    )
    assert del_resp.status_code == 200
    assert "released" in del_resp.json()["detail"].lower()

    # Check watch is AVAILABLE again
    watch_resp = client.get(f"/api/v1/watches/{watch_id}")
    assert watch_resp.json()["status"] == "AVAILABLE"


def test_get_cart_items(client, auth_headers_customer):
    list_resp = client.get("/api/v1/watches?brand=Breitling")
    watch_id = list_resp.json()["items"][0]["id"]

    # Reserve
    client.post(
        "/api/v1/cart/reserve",
        headers=auth_headers_customer,
        json={"watch_id": watch_id},
    )

    # Get cart
    cart_resp = client.get("/api/v1/cart", headers=auth_headers_customer)
    assert cart_resp.status_code == 200
    cart_items = cart_resp.json()
    assert len(cart_items) >= 1
    assert any(item["watch_id"] == watch_id for item in cart_items)
