from server.models import FctSalesOrder


def test_health_endpoints(client):
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    response = client.get("/livez")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    response = client.get("/")
    assert response.status_code == 200
    assert "service" in response.json()


def test_etl_run_full_pipeline(client, db_session):
    response = client.post("/api/v1/etl/sales-orders/run", json={})
    assert response.status_code == 200
    data = response.json()

    assert "job_id" in data
    assert data["status"] == "COMPLETED"
    metrics = data["metrics"]
    assert metrics["records_extracted"] == 8
    assert metrics["records_loaded"] == 4
    assert metrics["records_quarantined"] == 4
    assert metrics["breakdown"]["missing_amount"] == 1
    assert metrics["breakdown"]["invalid_email"] == 3

    # Check that cleaned records were loaded into fct_sales_orders
    loaded_orders = db_session.query(FctSalesOrder).all()
    assert len(loaded_orders) == 4
    for order in loaded_orders:
        assert order.amount is not None
        assert "@" in order.customer_email


def test_etl_run_with_date_filters(client, db_session):
    payload = {
        "start_date": "2026-05-10",
        "end_date": "2026-05-10",
        "batch_size": 500,
    }
    response = client.post("/api/v1/etl/sales-orders/run", json=payload)
    assert response.status_code == 200
    data = response.json()

    metrics = data["metrics"]
    assert metrics["records_extracted"] == 3  # ORD-1001, ORD-1002, ORD-2001
    assert metrics["records_loaded"] == 2  # ORD-1001, ORD-1002
    assert metrics["records_quarantined"] == 1  # ORD-2001 (bad amount)


def test_get_job_status_success(client):
    # Trigger a job
    run_resp = client.post("/api/v1/etl/sales-orders/run", json={})
    assert run_resp.status_code == 200
    job_id = run_resp.json()["job_id"]

    # Query status
    status_resp = client.get(f"/api/v1/etl/sales-orders/status/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()

    assert status_data["job_id"] == job_id
    assert status_data["status"] == "COMPLETED"
    assert status_data["progress_percentage"] == 100.0
    assert status_data["metrics"]["records_loaded"] == 4


def test_get_job_status_not_found(client):
    response = client.get("/api/v1/etl/sales-orders/status/non_existent_job_123")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_quarantined_records(client):
    run_resp = client.post("/api/v1/etl/sales-orders/run", json={})
    job_id = run_resp.json()["job_id"]

    q_resp = client.get(f"/api/v1/etl/sales-orders/quarantine/{job_id}")
    assert q_resp.status_code == 200
    q_data = q_resp.json()

    assert q_data["job_id"] == job_id
    assert q_data["quarantined_count"] == 4
    reasons = [r["reason"] for r in q_data["records"]]
    assert "MISSING_OR_INVALID_AMOUNT" in reasons
    assert "INVALID_EMAIL_FORMAT" in reasons
