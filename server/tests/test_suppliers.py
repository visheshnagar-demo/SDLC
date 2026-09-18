def test_list_suppliers(client):
    response = client.get("/api/v1/suppliers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_and_get_supplier(client):
    payload = {
        "name": "Greenhouse Farms",
        "contact_person": "Jane Doe",
        "email": "jane@greenhouse.com",
        "phone": "555-9988",
        "address": "789 Sun Valley Rd",
    }
    response = client.post("/api/v1/suppliers", json=payload)
    assert response.status_code == 201
    supplier = response.json()
    assert supplier["name"] == "Greenhouse Farms"
    supplier_id = supplier["id"]

    # Get
    get_res = client.get(f"/api/v1/suppliers/{supplier_id}")
    assert get_res.status_code == 200
    assert get_res.json()["email"] == "jane@greenhouse.com"


def test_update_and_delete_supplier(client):
    payload = {"name": "Temp Supplier", "email": "temp@supplier.com"}
    res = client.post("/api/v1/suppliers", json=payload)
    sup_id = res.json()["id"]

    # Update
    up_res = client.put(f"/api/v1/suppliers/{sup_id}", json={"phone": "123-4567"})
    assert up_res.status_code == 200
    assert up_res.json()["phone"] == "123-4567"

    # Delete
    del_res = client.delete(f"/api/v1/suppliers/{sup_id}")
    assert del_res.status_code == 204

    # Verify
    assert client.get(f"/api/v1/suppliers/{sup_id}").status_code == 404
