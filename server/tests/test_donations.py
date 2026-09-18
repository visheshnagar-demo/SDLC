def test_create_and_get_donation(client):
    payload = {
        "fund_type": "annadanam",
        "amount": 501.0,
        "payment_method": "upi",
        "is_tax_exempt": True,
    }
    res = client.post("/api/v1/donations", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["receipt_number"].startswith("RCPT-2026-")
    assert data["amount"] == 501.0
    assert data["tax_80g_ref"] is not None

    donation_id = data["id"]
    get_res = client.get(f"/api/v1/donations/{donation_id}")
    assert get_res.status_code == 200
    assert get_res.json()["fund_type"] == "annadanam"
