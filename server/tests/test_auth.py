def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@example.com"
    assert data["user"]["role"] == "ADMIN"


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "detail" in response.json()


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "somepassword"},
    )
    assert response.status_code == 401


def test_register_and_me(client):
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newnurse@example.com",
            "password": "nursepassword",
            "full_name": "Nurse Sarah",
            "role": "NURSE",
        },
    )
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert reg_data["email"] == "newnurse@example.com"
    assert reg_data["role"] == "NURSE"

    # Login with new credentials
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "newnurse@example.com", "password": "nursepassword"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Call /auth/me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "newnurse@example.com"


def test_get_me_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
