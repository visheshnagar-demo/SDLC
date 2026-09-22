def test_get_watches_catalog(client):
    response = client.get("/api/v1/watches")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    assert len(data["items"]) >= 1
    # Verify watch fields
    first = data["items"][0]
    assert "brand" in first
    assert "model" in first
    assert "price" in first
    assert "condition_score" in first
    assert "certificate_number" in first


def test_filter_by_brand(client):
    response = client.get("/api/v1/watches?brand=Rolex")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert "rolex" in item["brand"].lower()


def test_filter_by_price_range(client):
    response = client.get("/api/v1/watches?min_price=10000&max_price=20000")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert 10000 <= item["price"] <= 20000


def test_filter_by_condition(client):
    response = client.get("/api/v1/watches?min_condition=9.5")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["condition_score"] >= 9.5


def test_filter_by_box_and_papers(client):
    response = client.get("/api/v1/watches?box_papers=complete_set")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["box_included"] is True
        assert item["papers_included"] is True


def test_search_watches(client):
    response = client.get("/api/v1/watches?search=Speedmaster")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 1
    assert "Speedmaster" in data["items"][0]["model"]


def test_get_watch_detail(client):
    # Fetch list first to get an ID
    list_resp = client.get("/api/v1/watches")
    watch_id = list_resp.json()["items"][0]["id"]

    response = client.get(f"/api/v1/watches/{watch_id}")
    assert response.status_code == 200
    watch = response.json()
    assert watch["id"] == watch_id
    assert "authenticator_notes" in watch
    assert "case_size_mm" in watch


def test_get_watch_not_found(client):
    response = client.get("/api/v1/watches/non-existent-uuid-123")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_admin_create_watch(client, auth_headers_admin):
    response = client.post(
        "/api/v1/watches",
        headers=auth_headers_admin,
        json={
            "brand": "Vacheron Constantin",
            "model": "Overseas Self-Winding 4500V",
            "reference_number": "4500V/110A-B128",
            "serial_number": "VC-77291-M",
            "year_of_manufacture": 2022,
            "condition_score": 9.9,
            "condition_grade": "Mint",
            "price": 31000.0,
            "movement_type": "Automatic",
            "case_size_mm": 41.0,
            "dial_color": "Blue Lacquered",
            "bezel_material": "Stainless Steel",
            "strap_material": "Interchangeable Steel, Rubber & Alligator",
            "box_included": True,
            "papers_included": True,
            "authentication_status": "VERIFIED",
            "certificate_number": "CERT-VC-9011",
            "authenticator_notes": "Hallmark of Geneva certified. Flawless lacquered blue dial.",
            "image_urls": [
                "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"
            ],
            "status": "AVAILABLE",
        },
    )
    assert response.status_code == 201
    created = response.json()
    assert created["brand"] == "Vacheron Constantin"
    assert created["certificate_number"] == "CERT-VC-9011"


def test_customer_cannot_create_watch(client, auth_headers_customer):
    response = client.post(
        "/api/v1/watches",
        headers=auth_headers_customer,
        json={
            "brand": "Fake Watch",
            "model": "Test",
            "reference_number": "REF-1",
            "serial_number": "SN-1",
            "year_of_manufacture": 2020,
            "condition_score": 9.0,
            "condition_grade": "Good",
            "price": 5000.0,
            "movement_type": "Automatic",
            "case_size_mm": 40.0,
            "dial_color": "White",
            "bezel_material": "Steel",
            "strap_material": "Leather",
            "certificate_number": "CERT-TEST",
        },
    )
    assert response.status_code == 403
    assert "Admin privileges required" in response.json()["detail"]


def test_admin_update_watch(client, auth_headers_admin):
    # Get a watch
    list_resp = client.get("/api/v1/watches")
    watch_id = list_resp.json()["items"][0]["id"]

    response = client.patch(
        f"/api/v1/watches/{watch_id}",
        headers=auth_headers_admin,
        json={"price": 15200.0, "authenticator_notes": "Updated atelier timing note"},
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["price"] == 15200.0
    assert updated["authenticator_notes"] == "Updated atelier timing note"


def test_admin_delete_watch(client, auth_headers_admin):
    # Create temporary watch to delete
    create_resp = client.post(
        "/api/v1/watches",
        headers=auth_headers_admin,
        json={
            "brand": "Tudor",
            "model": "Black Bay 58",
            "reference_number": "M79030N-0001",
            "serial_number": "TD-55443-DEL",
            "year_of_manufacture": 2021,
            "condition_score": 9.3,
            "condition_grade": "Near Mint",
            "price": 3400.0,
            "movement_type": "Automatic",
            "case_size_mm": 39.0,
            "dial_color": "Black",
            "bezel_material": "Anodized Aluminum",
            "strap_material": "Riveted Steel",
            "box_included": True,
            "papers_included": True,
            "certificate_number": "CERT-TD-DELETE",
        },
    )
    watch_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/watches/{watch_id}", headers=auth_headers_admin)
    assert del_resp.status_code == 200

    # Verify 404
    get_resp = client.get(f"/api/v1/watches/{watch_id}")
    assert get_resp.status_code == 404
