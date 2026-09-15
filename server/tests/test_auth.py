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
    assert data["user"]["role"] == "MEMBER"


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "password"},
    )
    assert response.status_code == 401


def test_register_new_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "SecurePassword123!",
            "full_name": "Jordan Casey",
            "phone_number": "+1-555-9988",
            "fitness_goals": "Flexibility and core strength",
            "emergency_contact": "Taylor Casey (+1-555-9989)",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "Jordan Casey"


def test_register_duplicate_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "somepassword",
            "full_name": "Duplicate Test",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"
