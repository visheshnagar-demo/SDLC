def test_create_and_list_accounts(client):
    payload = {
        "account_number": "ACC-TEST-999",
        "owner_name": "New User",
        "owner_email": "newuser@example.com",
        "role": "user",
        "status": "active",
    }
    res = client.post("/api/v1/accounts", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["account_number"] == "ACC-TEST-999"

    list_res = client.get("/api/v1/accounts?limit=10")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_get_account_balance(client):
    list_res = client.get("/api/v1/accounts")
    test_user = next(
        a for a in list_res.json() if a["owner_email"] == "test@example.com"
    )

    bal_res = client.get(f"/api/v1/accounts/{test_user['id']}/balance")
    assert bal_res.status_code == 200
    bal_data = bal_res.json()
    assert bal_data["account_id"] == test_user["id"]
    assert "total_balance" in bal_data
