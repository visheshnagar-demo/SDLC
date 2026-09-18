def test_list_suppliers(client):
    response = client.get("/api/v1/suppliers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["name"] == "Floral Wholesalers Inc."


def test_create_get_update_delete_supplier(client):
    # Create
    payload = {
        "name": "Greenhouse Farms",
        "contact_person": "Robert Green",
        "email": "robert@greenhouse.com",
        "phone": "555-9876",
        "address": "456 Valley Road",
    }
    create_res = client.post("/api/v1/suppliers", json=payload)
    assert create_res.status_code == 201
    supplier_id = create_res.json()["id"]
    assert create_res.json()["name"] == "Greenhouse Farms"

    # Get
    get_res = client.get(f"/api/v1/suppliers/{supplier_id}")
    assert get_res.status_code == 200
    assert get_res.json()["contact_person"] == "Robert Green"

    # Update
    update_res = client.put(
        f"/api/v1/suppliers/{supplier_id}",
        json={"contact_person": "Robert Green Jr.", "phone": "555-9999"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["contact_person"] == "Robert Green Jr."
    assert update_res.json()["phone"] == "555-9999"

    # Delete
    del_res = client.delete(f"/api/v1/suppliers/{supplier_id}")
    assert del_res.status_code == 204

    get_again = client.get(f"/api/v1/suppliers/{supplier_id}")
    assert get_again.status_code == 404
