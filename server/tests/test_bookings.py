import uuid
from datetime import datetime, timedelta, timezone
from server.models.fitness_class import FitnessClass


def test_book_class_success(client, member_auth_headers, db_session):
    # Find a class with available spots in the future
    now = datetime.now(timezone.utc)
    new_class = FitnessClass(
        id=str(uuid.uuid4()),
        title="Future Spin Blast",
        category="Spin",
        description="High intensity sprint session",
        instructor_name="Alex Parker",
        start_time=now + timedelta(days=5),
        end_time=now + timedelta(days=5, hours=1),
        max_capacity=10,
        booked_count=2,
    )
    db_session.add(new_class)
    db_session.commit()

    response = client.post(
        "/api/v1/bookings",
        headers=member_auth_headers,
        json={"class_id": new_class.id},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["class_id"] == new_class.id
    assert data["status"] == "CONFIRMED"

    # Verify spot decrement / booked_count increment
    refreshed_class = client.get(f"/api/v1/classes/{new_class.id}").json()
    assert refreshed_class["booked_count"] == 3
    assert refreshed_class["available_spots"] == 7


def test_book_class_duplicate_rejected(client, member_auth_headers, db_session):
    now = datetime.now(timezone.utc)
    new_class = FitnessClass(
        id=str(uuid.uuid4()),
        title="Duplicate Test Class",
        category="Strength",
        instructor_name="Sam Rivera",
        start_time=now + timedelta(days=6),
        end_time=now + timedelta(days=6, hours=1),
        max_capacity=15,
        booked_count=1,
    )
    db_session.add(new_class)
    db_session.commit()

    res1 = client.post(
        "/api/v1/bookings",
        headers=member_auth_headers,
        json={"class_id": new_class.id},
    )
    assert res1.status_code == 201

    res2 = client.post(
        "/api/v1/bookings",
        headers=member_auth_headers,
        json={"class_id": new_class.id},
    )
    assert res2.status_code == 400
    assert "Already booked" in res2.json()["detail"]


def test_book_full_class_rejected(client, member_auth_headers, db_session):
    now = datetime.now(timezone.utc)
    full_class = FitnessClass(
        id=str(uuid.uuid4()),
        title="Full Capacity HIIT",
        category="HIIT",
        instructor_name="Taylor Reed",
        start_time=now + timedelta(days=7),
        end_time=now + timedelta(days=7, hours=1),
        max_capacity=5,
        booked_count=5,
    )
    db_session.add(full_class)
    db_session.commit()

    res = client.post(
        "/api/v1/bookings",
        headers=member_auth_headers,
        json={"class_id": full_class.id},
    )
    assert res.status_code == 400
    assert "Class is already full" in res.json()["detail"]


def test_get_my_bookings(client, member_auth_headers):
    response = client.get("/api/v1/bookings/me", headers=member_auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_cancel_booking_success(client, member_auth_headers, db_session):
    now = datetime.now(timezone.utc)
    new_class = FitnessClass(
        id=str(uuid.uuid4()),
        title="Cancellable Class",
        category="Yoga",
        instructor_name="Jordan Lee",
        start_time=now + timedelta(days=3),  # 3 days ahead (> 2 hours)
        end_time=now + timedelta(days=3, hours=1),
        max_capacity=10,
        booked_count=0,
    )
    db_session.add(new_class)
    db_session.commit()

    book_res = client.post(
        "/api/v1/bookings",
        headers=member_auth_headers,
        json={"class_id": new_class.id},
    )
    assert book_res.status_code == 201
    booking_id = book_res.json()["id"]

    cancel_res = client.delete(
        f"/api/v1/bookings/{booking_id}",
        headers=member_auth_headers,
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["detail"] == "Booking cancelled successfully"

    # Spot returned
    refreshed = client.get(f"/api/v1/classes/{new_class.id}").json()
    assert refreshed["booked_count"] == 0


def test_cancel_booking_late_policy_rejection(client, member_auth_headers, db_session):
    now = datetime.now(timezone.utc)
    # Class starts in 30 minutes (< 2 hours)
    near_class = FitnessClass(
        id=str(uuid.uuid4()),
        title="Imminent Class",
        category="HIIT",
        instructor_name="Taylor Reed",
        start_time=now + timedelta(minutes=30),
        end_time=now + timedelta(minutes=90),
        max_capacity=10,
        booked_count=0,
    )
    db_session.add(near_class)
    db_session.commit()

    book_res = client.post(
        "/api/v1/bookings",
        headers=member_auth_headers,
        json={"class_id": near_class.id},
    )
    assert book_res.status_code == 201
    booking_id = book_res.json()["id"]

    cancel_res = client.delete(
        f"/api/v1/bookings/{booking_id}",
        headers=member_auth_headers,
    )
    assert cancel_res.status_code == 400
    assert "Cancellation window expired" in cancel_res.json()["detail"]
