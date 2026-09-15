from datetime import datetime, timedelta, timezone


def test_admin_create_class(client, admin_auth_headers):
    now = datetime.now(timezone.utc)
    res = client.post(
        "/api/v1/admin/classes",
        headers=admin_auth_headers,
        json={
            "title": "Evening Power Yoga",
            "category": "Yoga",
            "description": "Candlelight evening relaxation and stretch",
            "instructor_name": "Jordan Lee",
            "start_time": (now + timedelta(days=2, hours=19)).isoformat(),
            "end_time": (now + timedelta(days=2, hours=20)).isoformat(),
            "max_capacity": 20,
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Evening Power Yoga"
    assert data["max_capacity"] == 20
    assert data["booked_count"] == 0


def test_admin_create_class_forbidden_for_member(client, member_auth_headers):
    now = datetime.now(timezone.utc)
    res = client.post(
        "/api/v1/admin/classes",
        headers=member_auth_headers,
        json={
            "title": "Unauthorized Class",
            "category": "Yoga",
            "instructor_name": "Nobody",
            "start_time": (now + timedelta(days=1)).isoformat(),
            "end_time": (now + timedelta(days=1, hours=1)).isoformat(),
            "max_capacity": 10,
        },
    )
    assert res.status_code == 403


def test_admin_update_class(client, admin_auth_headers):
    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/admin/classes",
        headers=admin_auth_headers,
        json={
            "title": "Initial Class Title",
            "category": "HIIT",
            "instructor_name": "Initial Trainer",
            "start_time": (now + timedelta(days=3)).isoformat(),
            "end_time": (now + timedelta(days=3, hours=1)).isoformat(),
            "max_capacity": 15,
        },
    )
    assert create_res.status_code == 201
    class_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/admin/classes/{class_id}",
        headers=admin_auth_headers,
        json={
            "title": "Updated Class Title",
            "instructor_name": "Lead Trainer",
            "max_capacity": 25,
        },
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["title"] == "Updated Class Title"
    assert updated_data["instructor_name"] == "Lead Trainer"
    assert updated_data["max_capacity"] == 25


def test_admin_get_class_roster(client, admin_auth_headers, member_auth_headers):
    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/admin/classes",
        headers=admin_auth_headers,
        json={
            "title": "Roster Testing Class",
            "category": "Strength",
            "instructor_name": "Sam Rivera",
            "start_time": (now + timedelta(days=4)).isoformat(),
            "end_time": (now + timedelta(days=4, hours=1)).isoformat(),
            "max_capacity": 10,
        },
    )
    assert create_res.status_code == 201
    class_id = create_res.json()["id"]

    # Member books a spot
    book_res = client.post(
        "/api/v1/bookings",
        headers=member_auth_headers,
        json={"class_id": class_id},
    )
    assert book_res.status_code == 201

    # Admin checks roster
    roster_res = client.get(
        f"/api/v1/admin/classes/{class_id}/roster",
        headers=admin_auth_headers,
    )
    assert roster_res.status_code == 200
    roster = roster_res.json()
    assert roster["class_id"] == class_id
    assert roster["total_booked"] == 1
    assert len(roster["attendees"]) == 1
    assert roster["attendees"][0]["email"] == "test@example.com"


def test_admin_delete_class(client, admin_auth_headers):
    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/admin/classes",
        headers=admin_auth_headers,
        json={
            "title": "Class To Delete",
            "category": "Pilates",
            "instructor_name": "Casey Quinn",
            "start_time": (now + timedelta(days=8)).isoformat(),
            "end_time": (now + timedelta(days=8, hours=1)).isoformat(),
            "max_capacity": 12,
        },
    )
    assert create_res.status_code == 201
    class_id = create_res.json()["id"]

    del_res = client.delete(
        f"/api/v1/admin/classes/{class_id}",
        headers=admin_auth_headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["detail"] == "Class deleted successfully"

    # Confirm it's gone
    get_res = client.get(f"/api/v1/classes/{class_id}")
    assert get_res.status_code == 404


def test_admin_get_stats(client, admin_auth_headers):
    res = client.get("/api/v1/admin/stats", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_classes" in data
    assert "active_bookings" in data
    assert "capacity_utilization_percent" in data
    assert "active_instructors" in data
