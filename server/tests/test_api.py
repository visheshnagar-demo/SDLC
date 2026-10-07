from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

    resp_v1 = client.get("/api/v1/health")
    assert resp_v1.status_code == 200


def test_rooms_crud(client: TestClient):
    # 1. List seeded rooms
    res = client.get("/api/v1/rooms")
    assert res.status_code == 200
    rooms = res.json()
    assert len(rooms) >= 5

    # Filter by category
    res_deluxe = client.get("/api/v1/rooms?category=Deluxe")
    assert res_deluxe.status_code == 200
    assert all(r["room_category"].lower() == "deluxe" for r in res_deluxe.json())

    # Filter by status
    res_avail = client.get("/api/v1/rooms?status=Available")
    assert res_avail.status_code == 200
    assert all(r["status"].lower() == "available" for r in res_avail.json())

    # 2. Create new room
    new_room_payload = {
        "room_number": "301",
        "room_category": "Deluxe",
        "base_rate_per_night": 175.50,
        "floor_number": 3,
        "max_occupancy": 3,
        "amenities": ["King Bed", "Balcony", "Mountain View"],
    }
    create_res = client.post("/api/v1/rooms", json=new_room_payload)
    assert create_res.status_code == 201
    created_room = create_res.json()
    assert created_room["room_number"] == "301"
    assert created_room["base_rate_per_night"] == 175.50
    assert created_room["status"] == "Available"
    assert "Mountain View" in created_room["amenities"]
    room_id = created_room["id"]

    # 3. Duplicate room number rejection
    dup_res = client.post("/api/v1/rooms", json=new_room_payload)
    assert dup_res.status_code == 400

    # 4. Get room by ID
    get_res = client.get(f"/api/v1/rooms/{room_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == room_id

    # 5. Update room status
    status_res = client.patch(
        f"/api/v1/rooms/{room_id}/status", json={"status": "Under Maintenance"}
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Under Maintenance"

    # 6. Update room details
    update_res = client.patch(
        f"/api/v1/rooms/{room_id}",
        json={"base_rate_per_night": 190.0, "status": "Available"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["base_rate_per_night"] == 190.0
    assert update_res.json()["status"] == "Available"

    # 7. Delete room
    del_res = client.delete(f"/api/v1/rooms/{room_id}")
    assert del_res.status_code == 204

    # Confirm 404
    get_404 = client.get(f"/api/v1/rooms/{room_id}")
    assert get_404.status_code == 404


def test_guests_crud(client: TestClient):
    # 1. List seeded guests
    res = client.get("/api/v1/guests")
    assert res.status_code == 200
    guests = res.json()
    assert len(guests) >= 2

    # Search guest
    res_search = client.get("/api/v1/guests?search=Eleanor")
    assert res_search.status_code == 200
    assert len(res_search.json()) >= 1
    assert "Eleanor" in res_search.json()[0]["full_name"]

    # 2. Register new guest
    new_guest_payload = {
        "full_name": "Marcus Aurelius",
        "email": "marcus.aurelius@rome.org",
        "phone_number": "+1-555-0988",
        "id_proof_type": "Passport",
        "id_proof_number": "ROM-991823",
        "address": "Palatine Hill, Rome",
        "vip_status": True,
    }
    create_res = client.post("/api/v1/guests", json=new_guest_payload)
    assert create_res.status_code == 201
    guest_data = create_res.json()
    assert guest_data["full_name"] == "Marcus Aurelius"
    assert guest_data["vip_status"] is True
    guest_id = guest_data["id"]

    # Duplicate email check
    dup_res = client.post("/api/v1/guests", json=new_guest_payload)
    assert dup_res.status_code == 400

    # 3. Get guest by ID
    get_res = client.get(f"/api/v1/guests/{guest_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == guest_id

    # 4. Update guest profile
    update_res = client.patch(
        f"/api/v1/guests/{guest_id}",
        json={"phone_number": "+1-555-7766", "address": "Capitoline Hill"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["phone_number"] == "+1-555-7766"

    # 5. Delete guest
    del_res = client.delete(f"/api/v1/guests/{guest_id}")
    assert del_res.status_code == 204

    # Confirm 404
    get_404 = client.get(f"/api/v1/guests/{guest_id}")
    assert get_404.status_code == 404


def test_booking_lifecycle_and_concurrency(client: TestClient):
    # Fetch a guest and an available room
    guest_res = client.get("/api/v1/guests?search=Eleanor")
    assert guest_res.status_code == 200
    guest_id = guest_res.json()[0]["id"]

    room_res = client.get("/api/v1/rooms?status=Available")
    assert room_res.status_code == 200
    room = room_res.json()[0]
    room_id = room["id"]
    base_rate = room["base_rate_per_night"]

    # 1. Invalid dates: checkout <= checkin
    invalid_dates_payload = {
        "guest_id": guest_id,
        "room_id": room_id,
        "check_in_date": "2026-08-15",
        "check_out_date": "2026-08-10",
        "special_requests": "Ocean view please",
    }
    err_res = client.post("/api/v1/bookings", json=invalid_dates_payload)
    assert err_res.status_code == 400

    # 2. Valid booking creation: 3 nights
    booking_payload = {
        "guest_id": guest_id,
        "room_id": room_id,
        "check_in_date": "2026-08-10",
        "check_out_date": "2026-08-13",
        "special_requests": "Late arrival",
    }
    res = client.post("/api/v1/bookings", json=booking_payload)
    assert res.status_code == 201
    booking = res.json()
    assert booking["guest_id"] == guest_id
    assert booking["room_id"] == room_id
    assert booking["total_nights"] == 3
    assert booking["total_amount"] == round(base_rate * 3, 2)
    assert booking["booking_status"] == "Reserved"
    booking_id = booking["id"]

    # 3. Double-booking prevention: attempt overlapping booking on same room
    overlap_payload = {
        "guest_id": guest_id,
        "room_id": room_id,
        "check_in_date": "2026-08-12",
        "check_out_date": "2026-08-15",
    }
    overlap_res = client.post("/api/v1/bookings", json=overlap_payload)
    assert overlap_res.status_code == 409  # Conflict!

    # 4. Check-in workflow
    checkin_res = client.post(f"/api/v1/bookings/{booking_id}/check-in")
    assert checkin_res.status_code == 200
    assert checkin_res.json()["booking_status"] == "CheckedIn"
    assert checkin_res.json()["actual_check_in"] is not None

    # Verify room is now Occupied
    room_check = client.get(f"/api/v1/rooms/{room_id}").json()
    assert room_check["status"] == "Occupied"

    # 5. Check-out workflow
    checkout_res = client.post(f"/api/v1/bookings/{booking_id}/check-out")
    assert checkout_res.status_code == 200
    assert checkout_res.json()["booking_status"] == "CheckedOut"
    assert checkout_res.json()["actual_check_out"] is not None

    # Verify room is now Available again
    room_after = client.get(f"/api/v1/rooms/{room_id}").json()
    assert room_after["status"] == "Available"


def test_booking_cancellation(client: TestClient):
    guest_id = client.get("/api/v1/guests").json()[0]["id"]
    room_id = client.get("/api/v1/rooms?status=Available").json()[0]["id"]

    booking_payload = {
        "guest_id": guest_id,
        "room_id": room_id,
        "check_in_date": "2026-09-01",
        "check_out_date": "2026-09-03",
    }
    b_res = client.post("/api/v1/bookings", json=booking_payload)
    assert b_res.status_code == 201
    booking_id = b_res.json()["id"]

    cancel_res = client.post(f"/api/v1/bookings/{booking_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["booking_status"] == "Cancelled"


def test_invoicing_and_settlement(client: TestClient):
    # Fetch seeded invoice for John Smith (INV-2026-00481)
    inv_list = client.get("/api/v1/invoices").json()
    assert len(inv_list) >= 1
    invoice = inv_list[0]
    invoice_id = invoice["id"]

    # 1. Get single invoice
    get_res = client.get(f"/api/v1/invoices/{invoice_id}")
    assert get_res.status_code == 200
    inv_data = get_res.json()
    assert "items" in inv_data
    assert len(inv_data["items"]) >= 1

    # 2. Add extra service / amenity item (Spa Treatment)
    add_item_payload = {
        "description": "Spa - Swedish Massage",
        "item_type": "Spa",
        "unit_price": 85.00,
        "quantity": 1,
    }
    item_res = client.post(
        f"/api/v1/invoices/{invoice_id}/items", json=add_item_payload
    )
    assert item_res.status_code == 201
    updated_inv = item_res.json()
    assert any(
        i["description"] == "Spa - Swedish Massage" for i in updated_inv["items"]
    )
    assert updated_inv["service_charges"] >= 85.00
    assert updated_inv["total_payable"] > updated_inv["room_charges"]

    # 3. Settle Payment
    pay_res = client.post(
        f"/api/v1/invoices/{invoice_id}/pay",
        json={"payment_method": "CreditCard"},
    )
    assert pay_res.status_code == 200
    paid_inv = pay_res.json()
    assert paid_inv["payment_status"] == "Paid"
    assert paid_inv["payment_method"] == "CreditCard"
    assert paid_inv["paid_at"] is not None

    # Cannot add items to paid invoice
    err_res = client.post(f"/api/v1/invoices/{invoice_id}/items", json=add_item_payload)
    assert err_res.status_code == 400

    # 4. Refund Payment
    refund_res = client.post(f"/api/v1/invoices/{invoice_id}/refund")
    assert refund_res.status_code == 200
    assert refund_res.json()["payment_status"] == "Refunded"


def test_analytics_dashboard(client: TestClient):
    res = client.get("/api/v1/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "occupancy_rate_percentage" in data
    assert "total_rooms" in data
    assert "occupied_rooms" in data
    assert "available_rooms" in data
    assert "today_revenue" in data
    assert data["total_rooms"] >= 5
    assert data["occupancy_rate_percentage"] >= 0.0
