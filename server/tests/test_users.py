def test_get_user_me(client, member_auth_headers):
    response = client.get("/api/v1/users/me", headers=member_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Alex Morgan"
    assert data["role"] == "MEMBER"


def test_get_user_me_unauthorized(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_update_user_me(client, member_auth_headers):
    response = client.put(
        "/api/v1/users/me",
        headers=member_auth_headers,
        json={
            "full_name": "Alex Morgan Updated",
            "fitness_goals": "Marathon training and hypertrophy",
            "phone_number": "+1-555-4321",
            "emergency_contact": "Morgan Emergency Contact (+1-555-1111)",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Alex Morgan Updated"
    assert data["fitness_goals"] == "Marathon training and hypertrophy"
    assert data["phone_number"] == "+1-555-4321"
    assert data["emergency_contact"] == "Morgan Emergency Contact (+1-555-1111)"
