def test_create_account(client):
    response = client.post(
        "/api/v1/accounts",
        json={
            "account_number": "ACC-TEST-002",
            "owner_name": "Alice Manager",
            "owner_email": "alice@example.com",
            "role": "OPERATIONS_MANAGER",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["account_number"] == "ACC-TEST-002"
    assert data["owner_email"] == "alice@example.com"
    assert data["role"] == "OPERATIONS_MANAGER"


def test_list_accounts(client):
    response = client.get("/api/v1/accounts?skip=0&limit=20")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_account_balance(client):
    # Fetch existing user account
    accs = client.get("/api/v1/accounts").json()
    acc_id = accs[0]["id"]

    response = client.get(f"/api/v1/accounts/{acc_id}/balance")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
