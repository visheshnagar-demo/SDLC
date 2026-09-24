import datetime
from fastapi.testclient import TestClient


def test_evaluate_clean_transaction(client: TestClient):
    payload = {
        "account_id": "ACC-CLEAN-01",
        "amount": 250.00,
        "currency": "USD",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "location_name": "San Francisco, CA",
        "merchant": "Target Store",
    }
    response = client.post("/api/v1/transactions/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["account_id"] == "ACC-CLEAN-01"
    assert data["is_suspicious"] is False
    assert data["risk_score"] == 0
    assert data["severity"] is None
    assert len(data["triggered_rules"]) == 0
    assert data["alert_id"] is None


def test_high_amount_rule_triggers_alert(client: TestClient):
    payload = {
        "account_id": "ACC-HIGH-01",
        "amount": 15000.00,
        "currency": "USD",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "location_name": "New York, NY",
        "merchant": "Luxury Jewelry Boutique",
    }
    response = client.post("/api/v1/transactions/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["is_suspicious"] is True
    assert data["alert_id"] is not None
    assert any(r["rule_type"] == "AMOUNT_THRESHOLD" for r in data["triggered_rules"])
    assert data["risk_score"] >= 40


def test_amount_exact_threshold_triggers(client: TestClient):
    payload = {
        "account_id": "ACC-EXACT-01",
        "amount": 10000.00,
        "currency": "USD",
        "merchant": "Electronics Store",
    }
    response = client.post("/api/v1/transactions/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["is_suspicious"] is True
    assert any(r["rule_type"] == "AMOUNT_THRESHOLD" for r in data["triggered_rules"])


def test_frequency_velocity_rule_triggers(client: TestClient):
    account = "ACC-VELOCITY-01"
    base_time = datetime.datetime.now(datetime.timezone.utc)

    # Post 4 rapid micro transactions
    for i in range(4):
        resp = client.post(
            "/api/v1/transactions/evaluate",
            json={
                "account_id": account,
                "amount": 50.00 + i,
                "currency": "USD",
                "timestamp": (
                    base_time + datetime.timedelta(seconds=i * 10)
                ).isoformat(),
            },
        )
        assert resp.status_code == 200

    # 5th transaction within 10 minutes triggers velocity rule (max_count = 5)
    resp5 = client.post(
        "/api/v1/transactions/evaluate",
        json={
            "account_id": account,
            "amount": 75.00,
            "currency": "USD",
            "timestamp": (base_time + datetime.timedelta(seconds=50)).isoformat(),
        },
    )
    assert resp5.status_code == 201
    data5 = resp5.json()
    assert data5["is_suspicious"] is True
    assert any(r["rule_type"] == "FREQUENCY_VELOCITY" for r in data5["triggered_rules"])


def test_geographic_velocity_impossible_travel(client: TestClient):
    account = "ACC-TRAVEL-01"
    t1 = datetime.datetime.now(datetime.timezone.utc)

    # Transaction 1: London, UK
    resp1 = client.post(
        "/api/v1/transactions/evaluate",
        json={
            "account_id": account,
            "amount": 120.00,
            "currency": "USD",
            "latitude": 51.5074,
            "longitude": -0.1278,
            "location_name": "London, UK",
            "merchant": "London Coffee Co",
            "timestamp": t1.isoformat(),
        },
    )
    assert resp1.status_code == 200

    # Transaction 2: New York, USA 30 minutes later (dist ~3,400 miles, speed ~6,800 mph > 500 mph)
    t2 = t1 + datetime.timedelta(minutes=30)
    resp2 = client.post(
        "/api/v1/transactions/evaluate",
        json={
            "account_id": account,
            "amount": 200.00,
            "currency": "USD",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "location_name": "New York, NY",
            "merchant": "Manhattan Bistro",
            "timestamp": t2.isoformat(),
        },
    )
    assert resp2.status_code == 201
    data2 = resp2.json()
    assert data2["is_suspicious"] is True
    assert data2["severity"] == "CRITICAL"
    assert any(
        r["rule_type"] == "GEOGRAPHIC_VELOCITY" for r in data2["triggered_rules"]
    )


def test_compound_risk_score_multiple_rules(client: TestClient):
    account = "ACC-COMPOUND-01"
    t1 = datetime.datetime.now(datetime.timezone.utc)

    # 1. First transaction in Tokyo
    client.post(
        "/api/v1/transactions/evaluate",
        json={
            "account_id": account,
            "amount": 100.00,
            "currency": "USD",
            "latitude": 35.6762,
            "longitude": 139.6503,
            "location_name": "Tokyo, Japan",
            "timestamp": t1.isoformat(),
        },
    )

    # 2. Second transaction in Paris 20 minutes later AND amount $25,000 (Triggers High Amount + Impossible Travel)
    t2 = t1 + datetime.timedelta(minutes=20)
    resp = client.post(
        "/api/v1/transactions/evaluate",
        json={
            "account_id": account,
            "amount": 25000.00,
            "currency": "USD",
            "latitude": 48.8566,
            "longitude": 2.3522,
            "location_name": "Paris, France",
            "timestamp": t2.isoformat(),
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["is_suspicious"] is True
    assert len(data["triggered_rules"]) >= 2
    assert data["severity"] == "CRITICAL"
    assert data["risk_score"] >= 80


def test_list_and_get_transactions(client: TestClient):
    response = client.get("/api/v1/transactions?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) > 0

    first_tx_id = data["items"][0]["id"]
    get_res = client.get(f"/api/v1/transactions/{first_tx_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == first_tx_id
