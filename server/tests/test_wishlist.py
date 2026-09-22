def test_toggle_wishlist_add_and_remove(client, auth_headers_customer):
    list_resp = client.get("/api/v1/watches")
    watch_id = list_resp.json()["items"][0]["id"]

    # 1. Add to wishlist
    add_resp = client.post(
        f"/api/v1/wishlist/{watch_id}", headers=auth_headers_customer
    )
    assert add_resp.status_code == 200
    assert add_resp.json()["in_wishlist"] is True
    assert add_resp.json()["watch_id"] == watch_id

    # 2. Verify in wishlist
    get_resp = client.get("/api/v1/wishlist", headers=auth_headers_customer)
    assert get_resp.status_code == 200
    items = get_resp.json()
    assert len(items) >= 1
    assert any(i["watch_id"] == watch_id for i in items)

    # 3. Toggle off
    remove_resp = client.post(
        f"/api/v1/wishlist/{watch_id}", headers=auth_headers_customer
    )
    assert remove_resp.status_code == 200
    assert remove_resp.json()["in_wishlist"] is False

    # 4. Verify no longer in wishlist
    get_resp2 = client.get("/api/v1/wishlist", headers=auth_headers_customer)
    assert get_resp2.status_code == 200
    items2 = get_resp2.json()
    assert not any(i["watch_id"] == watch_id for i in items2)


def test_wishlist_unauthorized(client):
    response = client.get("/api/v1/wishlist")
    assert response.status_code == 401
