from fastapi.testclient import TestClient


def test_list_alerts_and_stats(client: TestClient):
    stats_resp = client.get("/api/v1/alerts/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert "total_open" in stats
    assert "critical_count" in stats
    assert "under_review_count" in stats

    alerts_resp = client.get("/api/v1/alerts?skip=0&limit=10")
    assert alerts_resp.status_code == 200
    alerts_data = alerts_resp.json()
    assert alerts_data["total"] >= 1
    assert len(alerts_data["items"]) >= 1


def test_alert_lifecycle_and_status_transitions(client: TestClient):
    # 1. Trigger an alert first
    tx_resp = client.post(
        "/api/v1/transactions/evaluate",
        json={
            "account_id": "ACC-LIFECYCLE-01",
            "amount": 20000.00,
            "currency": "USD",
            "merchant": "Wire Transfer Service",
        },
    )
    assert tx_resp.status_code == 201
    alert_id = tx_resp.json()["alert_id"]
    assert alert_id is not None

    # 2. Get alert details
    detail_resp = client.get(f"/api/v1/alerts/{alert_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == alert_id
    assert detail["status"] == "NEW"
    assert detail["transaction"]["amount"] == 20000.00
    assert len(detail["violations"]) >= 1
    assert len(detail["audit_history"]) >= 1

    # 3. Transition NEW -> UNDER_REVIEW
    update1 = client.patch(
        f"/api/v1/alerts/{alert_id}/status",
        json={
            "status": "UNDER_REVIEW",
            "notes": "Investigation initiated by compliance team.",
            "actor": "sarah.jenkins@bank.com",
            "assigned_to": "sarah.jenkins@bank.com",
        },
    )
    assert update1.status_code == 200
    assert update1.json()["status"] == "UNDER_REVIEW"
    assert update1.json()["notes"] == "Investigation initiated by compliance team."

    # 4. Transition UNDER_REVIEW -> CONFIRMED_FRAUD
    update2 = client.patch(
        f"/api/v1/alerts/{alert_id}/status",
        json={
            "status": "CONFIRMED_FRAUD",
            "notes": "Customer confirmed unauthorized wire.",
            "actor": "sarah.jenkins@bank.com",
        },
    )
    assert update2.status_code == 200
    assert update2.json()["status"] == "CONFIRMED_FRAUD"

    # 5. Invalid transition CONFIRMED_FRAUD -> NEW should return 409
    invalid_update = client.patch(
        f"/api/v1/alerts/{alert_id}/status",
        json={
            "status": "NEW",
            "notes": "Attempting invalid reset",
            "actor": "test@bank.com",
        },
    )
    assert invalid_update.status_code == 409


def test_alert_not_found(client: TestClient):
    resp = client.get("/api/v1/alerts/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
