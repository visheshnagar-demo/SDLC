from datetime import datetime, timedelta, timezone


def test_checkin_checkout_lifecycle(
    client, host_user, host_headers, receptionist_headers
):
    # 1. Register
    start_time = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    reg_resp = client.post(
        "/api/v1/visitors/register",
        json={
            "full_name": "Grace Hopper",
            "email": "grace@navy.mil",
            "phone": "555-4433",
            "company": "US Navy",
            "purpose": "Compilers Workshop",
            "scheduled_start_time": start_time,
            "host_id": host_user.id,
        },
    )
    assert reg_resp.status_code == 201
    visit_id = reg_resp.json()["id"]

    # Try checking in before approval -> 400 Bad Request
    fail_checkin = client.post(
        f"/api/v1/checkin/{visit_id}/check-in",
        json={"badge_id": "BADGE-101"},
        headers=receptionist_headers,
    )
    assert fail_checkin.status_code == 400

    # 2. Host approves
    app_resp = client.post(
        f"/api/v1/approvals/{visit_id}/action",
        json={"action": "APPROVE"},
        headers=host_headers,
    )
    assert app_resp.status_code == 200
    pass_code = app_resp.json()["pass_code"]

    # 3. Receptionist looks up by pass code
    lookup_resp = client.get(
        f"/api/v1/checkin/lookup?query={pass_code}", headers=receptionist_headers
    )
    assert lookup_resp.status_code == 200
    lookup_items = lookup_resp.json()
    assert len(lookup_items) >= 1
    assert lookup_items[0]["id"] == visit_id

    # 4. Receptionist checks in visitor
    checkin_resp = client.post(
        f"/api/v1/checkin/{visit_id}/check-in",
        json={"badge_id": "BADGE-202"},
        headers=receptionist_headers,
    )
    assert checkin_resp.status_code == 200
    checkin_data = checkin_resp.json()
    assert checkin_data["status"] == "CHECKED_IN"
    assert checkin_data["badge_id"] == "BADGE-202"
    assert checkin_data["check_in_time"] is not None

    # Double check-in -> 409 Conflict
    dup_checkin = client.post(
        f"/api/v1/checkin/{visit_id}/check-in",
        json={"badge_id": "BADGE-202"},
        headers=receptionist_headers,
    )
    assert dup_checkin.status_code == 409

    # 5. Receptionist checks out visitor
    checkout_resp = client.post(
        f"/api/v1/checkin/{visit_id}/check-out",
        headers=receptionist_headers,
    )
    assert checkout_resp.status_code == 200
    checkout_data = checkout_resp.json()
    assert checkout_data["status"] == "CHECKED_OUT"
    assert checkout_data["check_out_time"] is not None

    # Double check-out -> 409 Conflict
    dup_checkout = client.post(
        f"/api/v1/checkin/{visit_id}/check-out",
        headers=receptionist_headers,
    )
    assert dup_checkout.status_code == 409
