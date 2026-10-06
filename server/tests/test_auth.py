def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_login_seeded_admin(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Admin"
    assert data["user"]["email"] == "admin@example.com"


def test_login_seeded_patient(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_register_new_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "secretpassword",
            "full_name": "New Patient",
            "role": "Patient",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"


def test_register_duplicate_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "password": "password123",
            "full_name": "Duplicate Admin",
            "role": "Admin",
        },
    )
    assert response.status_code == 400


def test_get_me(client, admin_headers):
    response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "admin@example.com"


def test_get_me_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
