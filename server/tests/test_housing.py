def test_list_housing_units(client, auth_headers):
    response = client.get("/api/v1/housing/units", headers=auth_headers)
    assert response.status_code == 200
    units = response.json()
    assert isinstance(units, list)
    assert len(units) >= 1


def test_assign_housing_cell(client, auth_headers):
    inmate_payload = {
        "first_name": "Michael",
        "last_name": "Scott",
        "date_of_birth": "1975-03-15",
        "gender": "Male",
        "ssn": "555-00-1111",
        "security_level": "MEDIUM",
    }
    inmate_resp = client.post(
        "/api/v1/inmates", json=inmate_payload, headers=auth_headers
    )
    assert inmate_resp.status_code == 201
    inmate_id = inmate_resp.json()["id"]

    units_resp = client.get("/api/v1/housing/units", headers=auth_headers)
    unit_id = units_resp.json()[0]["id"]

    assign_payload = {
        "inmate_id": inmate_id,
        "unit_id": unit_id,
        "cell_number": "A-101",
    }
    assign_resp = client.post(
        "/api/v1/housing/assign", json=assign_payload, headers=auth_headers
    )
    assert assign_resp.status_code == 200
    data = assign_resp.json()
    assert data["inmate_id"] == inmate_id
    assert data["cell_number"] == "A-101"
    assert data["status"] == "ASSIGNED"


def test_keep_away_conflict_and_supervisor_override(client, auth_headers):
    i1 = client.post(
        "/api/v1/inmates",
        json={
            "first_name": "Inmate1",
            "last_name": "A",
            "date_of_birth": "1990-01-01",
            "gender": "M",
            "ssn": "111-11-1111",
        },
        headers=auth_headers,
    ).json()
    i2 = client.post(
        "/api/v1/inmates",
        json={
            "first_name": "Inmate2",
            "last_name": "B",
            "date_of_birth": "1992-02-02",
            "gender": "M",
            "ssn": "222-22-2222",
        },
        headers=auth_headers,
    ).json()

    units = client.get("/api/v1/housing/units", headers=auth_headers).json()
    unit_id = units[0]["id"]

    client.post(
        "/api/v1/housing/assign",
        json={"inmate_id": i1["id"], "unit_id": unit_id, "cell_number": "Cell-1"},
        headers=auth_headers,
    )

    ka_resp = client.post(
        "/api/v1/housing/keep-away",
        json={
            "inmate_id": i1["id"],
            "keep_away_inmate_id": i2["id"],
            "reason": "Co-defendants",
        },
        headers=auth_headers,
    )
    assert ka_resp.status_code == 201

    blocked_resp = client.post(
        "/api/v1/housing/assign",
        json={"inmate_id": i2["id"], "unit_id": unit_id, "cell_number": "Cell-2"},
        headers=auth_headers,
    )
    assert blocked_resp.status_code == 400
    assert "keep-away" in blocked_resp.json()["detail"].lower()

    override_resp = client.post(
        "/api/v1/housing/assign",
        json={
            "inmate_id": i2["id"],
            "unit_id": unit_id,
            "cell_number": "Cell-2",
            "supervisor_override": True,
            "override_reason": "Facility overcrowding - separate wing",
        },
        headers=auth_headers,
    )
    assert override_resp.status_code == 200
    assert override_resp.json()["is_override"] is True
