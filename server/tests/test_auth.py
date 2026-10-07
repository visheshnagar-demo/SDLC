def test_register_user_success(client):
    payload = {
        "email": "newworker@example.com",
        "password": "secretpassword123",
        "full_name": "New Worker",
        "role": "farm_worker",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newworker@example.com"
    assert data["full_name"] == "New Worker"
    assert data["role"] == "farm_worker"
    assert "id" in data


def test_register_duplicate_email_fails(client):
    payload = {
        "email": "test@example.com",
        "password": "anotherpassword",
        "full_name": "Duplicate Test",
        "role": "farm_worker",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(client):
    payload = {
        "email": "test@example.com",
        "password": "testpassword",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@example.com"


def test_login_invalid_password_fails(client):
    payload = {
        "email": "test@example.com",
        "password": "wrongpassword",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_get_me_authenticated(client, worker_headers):
    response = client.get("/api/v1/auth/me", headers=worker_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


def test_get_me_unauthenticated_fails(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
