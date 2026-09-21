def test_release_eligibility_and_authorization(client, auth_headers):
    inmate = client.post(
        "/api/v1/inmates",
        json={
            "first_name": "Arthur",
            "last_name": "Dent",
            "date_of_birth": "1982-07-07",
            "gender": "Male",
            "ssn": "444-44-4444",
        },
        headers=auth_headers,
    ).json()

    eligibility1 = client.post(
        f"/api/v1/releases/check-eligibility/{inmate['id']}",
        headers=auth_headers,
    )
    assert eligibility1.status_code == 200
    assert eligibility1.json()["is_eligible_for_release"] is True

    hold_payload = {
        "inmate_id": inmate["id"],
        "hold_type": "DETAINER",
        "issuing_agency": "U.S. Marshals Service",
        "description": "Federal detainer pending extradition",
    }
    hold_resp = client.post(
        "/api/v1/releases/holds", json=hold_payload, headers=auth_headers
    )
    assert hold_resp.status_code == 201

    eligibility2 = client.post(
        f"/api/v1/releases/check-eligibility/{inmate['id']}",
        headers=auth_headers,
    )
    assert eligibility2.status_code == 200
    assert eligibility2.json()["is_eligible_for_release"] is False
    assert len(eligibility2.json()["blocking_holds"]) == 1

    auth_req = {
        "inmate_id": inmate["id"],
        "discharge_order_verified": True,
        "property_returned": True,
        "victim_notified": True,
        "authorized_by": "Warden Smith",
        "force_override": False,
    }
    blocked_auth = client.post(
        "/api/v1/releases/authorize", json=auth_req, headers=auth_headers
    )
    assert blocked_auth.status_code == 400

    auth_req["force_override"] = True
    ok_auth = client.post(
        "/api/v1/releases/authorize", json=auth_req, headers=auth_headers
    )
    assert ok_auth.status_code == 200
    rel_data = ok_auth.json()
    assert rel_data["status"] == "DISCHARGED"

    inmate_profile = client.get(
        f"/api/v1/inmates/{inmate['id']}", headers=auth_headers
    ).json()
    assert inmate_profile["status"] == "DISCHARGED"
