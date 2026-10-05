from fastapi.testclient import TestClient


def test_create_patron_success(client: TestClient):
    payload = {
        "full_name": "Eleanor Vance",
        "email": "eleanor.vance@example.com",
        "phone_number": "555-0144",
    }
    response = client.post("/api/v1/patrons", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == payload["full_name"]
    assert data["email"] == payload["email"]
    assert data["phone_number"] == payload["phone_number"]
    assert data["max_borrow_limit"] == 5
    assert data["account_status"] == "ACTIVE"
    assert data["total_fines_due"] == 0.0
    assert "id" in data


def test_create_patron_duplicate_email(client: TestClient):
    payload = {
        "full_name": "Theodora Crain",
        "email": "theodora@example.com",
        "phone_number": "555-0145",
    }
    res1 = client.post("/api/v1/patrons", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/patrons", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


def test_get_patron_by_id(client: TestClient):
    payload = {
        "full_name": "Luke Sanderson",
        "email": "luke.sanderson@example.com",
        "phone_number": "555-0146",
    }
    create_res = client.post("/api/v1/patrons", json=payload)
    patron_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/patrons/{patron_id}")
    assert get_res.status_code == 200
    assert get_res.json()["full_name"] == "Luke Sanderson"


def test_get_nonexistent_patron_404(client: TestClient):
    res = client.get("/api/v1/patrons/nonexistent-patron-id")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_list_patrons_search(client: TestClient):
    p1 = {"full_name": "Arthur Dent", "email": "arthur.dent@example.com"}
    p2 = {"full_name": "Ford Prefect", "email": "ford.prefect@example.com"}
    client.post("/api/v1/patrons", json=p1)
    client.post("/api/v1/patrons", json=p2)

    res = client.get("/api/v1/patrons?search=Dent")
    assert res.status_code == 200
    items = res.json()
    assert any(p["full_name"] == "Arthur Dent" for p in items)


def test_update_patron(client: TestClient):
    payload = {
        "full_name": "Trillian Astra",
        "email": "trillian@example.com",
        "phone_number": "555-0147",
    }
    create_res = client.post("/api/v1/patrons", json=payload)
    patron_id = create_res.json()["id"]

    update_payload = {"phone_number": "555-9999", "account_status": "SUSPENDED"}
    update_res = client.put(f"/api/v1/patrons/{patron_id}", json=update_payload)
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["phone_number"] == "555-9999"
    assert data["account_status"] == "SUSPENDED"


def test_get_patron_loans_empty(client: TestClient):
    payload = {"full_name": "Zaphod Beeblebrox", "email": "zaphod@example.com"}
    create_res = client.post("/api/v1/patrons", json=payload)
    patron_id = create_res.json()["id"]

    loans_res = client.get(f"/api/v1/patrons/{patron_id}/loans")
    assert loans_res.status_code == 200
    assert loans_res.json() == []
