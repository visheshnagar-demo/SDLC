def test_list_suppliers(client):
    response = client.get("/api/v1/suppliers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_create_supplier(client):
    payload = {
        "name": "Bloom Masters Direct",
        "contact_person": "Charlie Brown",
        "email": "charlie@bloommasters.com",
        "phone": "555-8899",
        "address": "789 Rose Boulevard",
    }
    response = client.post("/api/v1/suppliers", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Bloom Masters Direct"
    assert "id" in data


def test_get_supplier(client):
    suppliers = client.get("/api/v1/suppliers").json()
    sup_id = suppliers[0]["id"]

    response = client.get(f"/api/v1/suppliers/{sup_id}")
    assert response.status_code == 200
    assert response.json()["id"] == sup_id


def test_update_supplier(client):
    suppliers = client.get("/api/v1/suppliers").json()
    sup_id = suppliers[0]["id"]

    update_payload = {"phone": "555-9999"}
    response = client.put(f"/api/v1/suppliers/{sup_id}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["phone"] == "555-9999"


def test_delete_supplier(client):
    payload = {"name": "Temp Supplier"}
    create_res = client.post("/api/v1/suppliers", json=payload)
    sup_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/suppliers/{sup_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/v1/suppliers/{sup_id}")
    assert get_res.status_code == 404
