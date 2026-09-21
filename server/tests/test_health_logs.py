def test_mortality_decrements_active_count_and_exceeds_error(client):
    # Register flock
    flock_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Health Flock 1",
            "breed": "Rhode Island Red",
            "hatch_date": "2025-01-10",
            "initial_count": 500,
            "coop_location": "Coop #1",
        },
    )
    flock_id = flock_res.json()["id"]

    # Record 2 mortalities
    log_res = client.post(
        "/api/v1/health-logs",
        json={
            "flock_id": flock_id,
            "log_date": "2026-05-18",
            "log_type": "MORTALITY",
            "quantity": 2,
            "notes": "Natural Causes",
        },
    )
    assert log_res.status_code == 201
    log_data = log_res.json()
    assert log_data["updated_active_hen_count"] == 498
    assert log_data["log_type"] == "MORTALITY"

    # Verify flock's active_count updated
    get_flock = client.get(f"/api/v1/flocks/{flock_id}")
    assert get_flock.json()["active_count"] == 498

    # Attempt 500 mortalities when active_count is 498 -> 400 error
    fail_res = client.post(
        "/api/v1/health-logs",
        json={
            "flock_id": flock_id,
            "log_date": "2026-05-18",
            "log_type": "MORTALITY",
            "quantity": 500,
            "notes": "Invalid High Count",
        },
    )
    assert fail_res.status_code == 400
    assert "Mortality exceeds active hen count" in fail_res.json()["detail"]


def test_vaccination_log_keeps_active_count(client):
    flock_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Health Flock 2",
            "breed": "Sussex",
            "hatch_date": "2025-01-10",
            "initial_count": 300,
            "coop_location": "Coop #2",
        },
    )
    flock_id = flock_res.json()["id"]

    res = client.post(
        "/api/v1/health-logs",
        json={
            "flock_id": flock_id,
            "log_date": "2026-05-18",
            "log_type": "VACCINATION",
            "quantity": 300,
            "notes": "Gumboro vaccine booster",
        },
    )
    assert res.status_code == 201
    assert res.json()["updated_active_hen_count"] == 300


def test_list_health_logs(client):
    flock_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Health Flock 3",
            "breed": "Plymouth Rock",
            "hatch_date": "2025-01-10",
            "initial_count": 200,
            "coop_location": "Coop #3",
        },
    )
    flock_id = flock_res.json()["id"]

    client.post(
        "/api/v1/health-logs",
        json={
            "flock_id": flock_id,
            "log_date": "2026-05-18",
            "log_type": "ILLNESS",
            "quantity": 5,
            "notes": "Heat stress monitoring",
        },
    )

    list_res = client.get(f"/api/v1/health-logs?flock_id={flock_id}")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
