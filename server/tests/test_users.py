def test_list_users(client, admin_headers):
    response = client.get("/api/v1/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_create_user(client, admin_headers):
    user_payload = {
        "employee_id": "EMP-999",
        "email": "new.employee@example.com",
        "full_name": "New Employee",
        "department": "Security",
        "role": "EMPLOYEE",
        "password": "newpassword123",
        "is_active": True,
    }
    response = client.post("/api/v1/users", json=user_payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new.employee@example.com"
    assert data["employee_id"] == "EMP-999"
