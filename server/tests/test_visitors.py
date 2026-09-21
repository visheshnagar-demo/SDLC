import pytest


def test_visitor_check_in_and_check_out(client):
    # Get seeded inmate INM-1001
    inmate_res = client.get("/api/v1/inmates/INM-1001")
    assert inmate_res.status_code == 200
    inmate_id = inmate_res.json()["id"]

    # Check in clear visitor
    check_in_payload = {
        "visitor_id_number": "DL-CLEAR-123",
        "visitor_name": "Mary Jane",
        "inmate_id": inmate_id,
    }
    check_in_res = client.post("/api/v1/visitors/check-in", json=check_in_payload, headers={"X-User-Role": "GUARD"})
    assert check_in_res.status_code == 200
    v_data = check_in_res.json()
    assert v_data["status"] == "CHECKED_IN"
    assert v_data["visitor_name"] == "Mary Jane"

    log_id = v_data["id"]

    # Check out visitor
    check_out_payload = {"visitor_log_id": log_id}
    check_out_res = client.post("/api/v1/visitors/check-out", json=check_out_payload, headers={"X-User-Role": "GUARD"})
    assert check_out_res.status_code == 200
    assert check_out_res.json()["status"] == "COMPLETED"
    assert check_out_res.json()["check_out_time"] is not None


def test_banned_visitor_check_in_rejected(client):
    # Seeded banned visitor DL-9823411
    inmate_res = client.get("/api/v1/inmates/INM-1001")
    inmate_id = inmate_res.json()["id"]

    check_in_payload = {
        "visitor_id_number": "DL-9823411",
        "visitor_name": "Robert Smith",
        "inmate_id": inmate_id,
    }
    res = client.post("/api/v1/visitors/check-in", json=check_in_payload, headers={"X-User-Role": "GUARD"})
    assert res.status_code == 403
    assert "banned list" in res.json()["detail"]


def test_add_and_list_blacklist(client):
    blacklist_payload = {
        "visitor_id_number": "DL-NEW-BANNED",
        "reason": "Security threat",
    }
    add_res = client.post("/api/v1/visitors/blacklist", json=blacklist_payload, headers={"X-User-Role": "ADMIN"})
    assert add_res.status_code == 201

    list_res = client.get("/api/v1/visitors/blacklist")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(b["visitor_id_number"] == "DL-NEW-BANNED" for b in items)
