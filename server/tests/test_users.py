def test_list_users(client, admin_auth_headers):
    response = client.get("/api/v1/users", headers=admin_auth_headers)
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 2  # Seeded admin and test user
