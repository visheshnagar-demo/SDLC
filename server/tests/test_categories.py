def test_list_categories(client):
    response = client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_and_get_category(client):
    payload = {"name": "Orchids", "description": "Exotic orchids and hybrids"}
    response = client.post("/api/v1/categories", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["name"] == "Orchids"
    assert "id" in created

    # Get by ID
    get_res = client.get(f"/api/v1/categories/{created['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Orchids"


def test_duplicate_category_name_error(client):
    payload = {"name": "Roses", "description": "Duplicate name"}
    response = client.post("/api/v1/categories", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_update_and_delete_category(client):
    # Create category first
    cat_res = client.post(
        "/api/v1/categories",
        json={"name": "Carnations", "description": "Long lasting stems"},
    )
    cat_id = cat_res.json()["id"]

    # Update
    update_res = client.put(
        f"/api/v1/categories/{cat_id}", json={"description": "Updated description"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["description"] == "Updated description"

    # Delete
    del_res = client.delete(f"/api/v1/categories/{cat_id}")
    assert del_res.status_code == 204

    # Verify deleted
    get_res = client.get(f"/api/v1/categories/{cat_id}")
    assert get_res.status_code == 404
