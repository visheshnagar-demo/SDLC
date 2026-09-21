def test_movement_lifecycle_and_headcount(client, auth_headers):
    inmate = client.post(
        "/api/v1/inmates",
        json={
            "first_name": "Robert",
            "last_name": "Paulson",
            "date_of_birth": "1980-04-04",
            "gender": "Male",
            "ssn": "333-33-3333",
        },
        headers=auth_headers,
    ).json()

    dispatch_payload = {
        "inmate_id": inmate["id"],
        "source_location": "Unit A Cell 12",
        "destination_location": "County Courtroom 3",
        "purpose": "Court Appearance",
        "escort_officer": "Officer Davis",
        "expected_duration_minutes": 60,
    }
    dispatch_resp = client.post(
        "/api/v1/movements", json=dispatch_payload, headers=auth_headers
    )
    assert dispatch_resp.status_code == 201
    mov_data = dispatch_resp.json()
    movement_id = mov_data["id"]
    assert mov_data["status"] == "IN_TRANSIT"

    active_resp = client.get("/api/v1/movements/active", headers=auth_headers)
    assert active_resp.status_code == 200
    active_movements = active_resp.json()
    assert any(m["id"] == movement_id for m in active_movements)

    headcount_resp = client.get("/api/v1/movements/headcount", headers=auth_headers)
    assert headcount_resp.status_code == 200
    headcount = headcount_resp.json()
    assert "total_facility_capacity" in headcount
    assert "total_active_inmates" in headcount
    assert headcount["total_in_transit"] >= 1

    complete_resp = client.put(
        f"/api/v1/movements/{movement_id}/complete", headers=auth_headers
    )
    assert complete_resp.status_code == 200
    completed_data = complete_resp.json()
    assert completed_data["status"] == "COMPLETED"
    assert completed_data["arrival_time"] is not None
