def test_create_inmate_intake(client, auth_headers):
    payload = {
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-05-15",
        "gender": "Male",
        "ssn": "123-45-6789",
        "security_level": "MEDIUM",
        "gang_affiliation": "None",
        "medical_alerts": "Diabetic",
        "charges": [
            {
                "charge_code": "PC-459",
                "description": "Burglary in the second degree",
                "severity": "FELONY",
            }
        ],
        "property_items": [
            {
                "item_name": "Leather Wallet",
                "quantity": 1,
                "condition": "Good",
                "location": "Locker 12",
            }
        ],
    }
    response = client.post("/api/v1/inmates", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert data["booking_number"].startswith("BK-")
    assert data["status"] == "BOOKED"
    assert len(data["charges"]) == 1
    assert len(data["property_items"]) == 1


def test_duplicate_inmate_intake_rejected(client, auth_headers):
    payload = {
        "first_name": "Jane",
        "last_name": "Smith",
        "date_of_birth": "1988-08-20",
        "gender": "Female",
        "ssn": "987-65-4321",
        "security_level": "MINIMUM",
    }
    resp1 = client.post("/api/v1/inmates", json=payload, headers=auth_headers)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/inmates", json=payload, headers=auth_headers)
    assert resp2.status_code == 409


def test_list_and_search_inmates(client, auth_headers):
    client.post(
        "/api/v1/inmates",
        json={
            "first_name": "John",
            "last_name": "SearchTest",
            "date_of_birth": "1991-01-01",
            "gender": "Male",
            "ssn": "555-44-3322",
        },
        headers=auth_headers,
    )

    response = client.get("/api/v1/inmates?search=John", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(i["first_name"] == "John" for i in data)


def test_get_inmate_profile(client, auth_headers):
    created = client.post(
        "/api/v1/inmates",
        json={
            "first_name": "Profile",
            "last_name": "Test",
            "date_of_birth": "1992-02-02",
            "gender": "Female",
            "ssn": "666-55-4433",
        },
        headers=auth_headers,
    ).json()
    inmate_id = created["id"]

    profile_resp = client.get(f"/api/v1/inmates/{inmate_id}", headers=auth_headers)
    assert profile_resp.status_code == 200
    data = profile_resp.json()
    assert data["id"] == inmate_id


def test_get_nonexistent_inmate(client, auth_headers):
    response = client.get("/api/v1/inmates/non-existent-id", headers=auth_headers)
    assert response.status_code == 404
