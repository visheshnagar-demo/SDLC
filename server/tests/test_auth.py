def test_register_customer(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newbuyer@luxurywatches.com",
            "password": "securepassword123",
            "full_name": "James Bond",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newbuyer@luxurywatches.com"
    assert data["full_name"] == "James Bond"
    assert data["role"] == "customer"
    assert data["is_active"] is True
    assert "id" in data


def test_register_duplicate_email(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@luxurywatches.com",
            "password": "securepassword123",
            "full_name": "Duplicate User",
        },
    )
    # Attempt second registration with same email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@luxurywatches.com",
            "password": "anotherpassword123",
            "full_name": "Duplicate User 2",
        },
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@example.com"


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_get_current_user_profile(client, auth_headers_customer):
    response = client.get("/api/v1/auth/me", headers=auth_headers_customer)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "customer"


def test_get_current_user_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_user_addresses(client, auth_headers_customer):
    # Create new address
    create_resp = client.post(
        "/api/v1/auth/addresses",
        headers=auth_headers_customer,
        json={
            "street_address": "100 Wall Street, Floor 14",
            "city": "New York",
            "state": "NY",
            "postal_code": "10005",
            "country": "United States",
            "is_default": True,
        },
    )
    assert create_resp.status_code == 201
    addr = create_resp.json()
    assert addr["street_address"] == "100 Wall Street, Floor 14"
    assert addr["is_default"] is True

    # List addresses
    list_resp = client.get("/api/v1/auth/addresses", headers=auth_headers_customer)
    assert list_resp.status_code == 200
    addresses = list_resp.json()
    assert len(addresses) >= 1
