def test_list_and_create_pooja(client):
    res = client.get("/api/v1/poojas")
    assert res.status_code == 200
    poojas = res.json()
    assert len(poojas) > 0

    pooja_id = poojas[0]["id"]
    slot_res = client.get(f"/api/v1/poojas/{pooja_id}/slots")
    assert slot_res.status_code == 200
    slots = slot_res.json()
    assert len(slots) > 0

    slot_id = slots[0]["id"]

    # Book a pooja slot
    booking_payload = {
        "slot_id": slot_id,
        "sankalp_name": "Ramesh Sharma",
        "sankalp_gotra": "Kashyapa",
        "amount_paid": 101.0,
    }
    book_res = client.post("/api/v1/bookings", json=booking_payload)
    assert book_res.status_code == 201
    booking_data = book_res.json()
    assert booking_data["booking_number"].startswith("BOOK-2026-")
    assert "qr_code_token" in booking_data

    booking_id = booking_data["id"]

    # Verify QR pass
    verify_res = client.post(f"/api/v1/bookings/{booking_id}/verify-qr")
    assert verify_res.status_code == 200
    assert verify_res.json()["booking_status"] == "used"
