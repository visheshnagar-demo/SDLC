"""Tests for gate scanning, HMAC QR verification, and duplicate entry blocking."""
import pytest


def test_gate_validation_success(client, user_token):
    """Test first scan of a valid pass grants entry and marks check-in."""
    headers = {"Authorization": f"Bearer {user_token}"}
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]
    tier_id = client.get(f"/api/v1/events/{event_id}/tiers").json()[0]["id"]

    booking_resp = client.post(
        "/api/v1/bookings",
        json={
            "eventId": event_id,
            "passTierId": tier_id,
            "quantity": 1,
            "attendees": [{"fullName": "Devendra Joshi"}],
        },
        headers=headers,
    )
    pass_data = booking_resp.json()["passes"][0]
    qr_payload = pass_data["qr_payload"]

    scan_payload = {
        "gateIdentifier": "GATE-01-NORTH",
        "qrPayload": qr_payload,
    }
    response = client.post("/api/v1/gates/validate", json=scan_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "VALID"
    assert "Authorized" in res_data["message"]
    assert res_data["attendeeName"] == "Devendra Joshi"
    assert res_data["entryCount"] == 1


def test_gate_validation_duplicate_blocked(client, user_token):
    """Test scanning a single-entry pass a second time triggers ALREADY_USED error."""
    headers = {"Authorization": f"Bearer {user_token}"}
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    # Single-Day Pass has max_entries = 1
    tiers = client.get(f"/api/v1/events/{event_id}/tiers").json()
    single_day_tier = next(t for t in tiers if "Single-Day" in t["tier_name"])

    booking_resp = client.post(
        "/api/v1/bookings",
        json={
            "eventId": event_id,
            "passTierId": single_day_tier["id"],
            "quantity": 1,
            "attendees": [{"fullName": "Suresh Mehta"}],
        },
        headers=headers,
    )
    pass_data = booking_resp.json()["passes"][0]
    qr_payload = pass_data["qr_payload"]

    scan_payload = {
        "gateIdentifier": "GATE-02-SOUTH",
        "qrPayload": qr_payload,
    }

    # First Scan - Successful
    res1 = client.post("/api/v1/gates/validate", json=scan_payload)
    assert res1.status_code == 200
    assert res1.json()["status"] == "VALID"

    # Second Scan - Duplicate Blocked
    res2 = client.post("/api/v1/gates/validate", json=scan_payload)
    assert res2.status_code == 200
    res2_data = res2.json()
    assert res2_data["status"] == "ALREADY_USED"
    assert "already used" in res2_data["message"].lower()


def test_gate_validation_invalid_hmac_signature(client):
    """Test tampered QR code payload fails cryptographic signature verification."""
    tampered_qr = "GMSv1.eyJwaWQiOiJmYWtlLXBhc3MtaWQiLCJlaWQiOiJmYWtlIn0.deadbeefcafebabe12345678"
    scan_payload = {
        "gateIdentifier": "GATE-01-NORTH",
        "qrPayload": tampered_qr,
    }
    response = client.post("/api/v1/gates/validate", json=scan_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "INVALID_SIGNATURE"
    assert "verification failed" in res_data["message"].lower()
