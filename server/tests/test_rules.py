from fastapi.testclient import TestClient


def test_list_and_get_rules(client: TestClient):
    resp = client.get("/api/v1/rules")
    assert resp.status_code == 200
    rules = resp.json()
    assert isinstance(rules, list)
    assert len(rules) >= 3

    rule_id = rules[0]["id"]
    get_resp = client.get(f"/api/v1/rules/{rule_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == rule_id


def test_create_and_update_rule(client: TestClient):
    new_rule_payload = {
        "name": "Custom High Risk Threshold",
        "rule_type": "AMOUNT_THRESHOLD",
        "description": "Custom test rule for high amounts",
        "severity": "CRITICAL",
        "is_active": True,
        "parameters": {"threshold_amount": 50000.0},
    }
    create_resp = client.post(
        "/api/v1/rules?actor=compliance-admin@bank.com",
        json=new_rule_payload,
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == "Custom High Risk Threshold"
    assert created["severity"] == "CRITICAL"
    rule_id = created["id"]

    # Update rule parameters
    update_resp = client.put(
        f"/api/v1/rules/{rule_id}?actor=compliance-admin@bank.com",
        json={"parameters": {"threshold_amount": 40000.0}},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["parameters"]["threshold_amount"] == 40000.0


def test_toggle_rule_active_status(client: TestClient):
    rules = client.get("/api/v1/rules").json()
    rule_id = rules[0]["id"]
    initial_status = rules[0]["is_active"]

    # Toggle
    toggle_resp = client.patch(
        f"/api/v1/rules/{rule_id}/toggle?actor=compliance-admin@bank.com",
        json={"is_active": not initial_status},
    )
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["is_active"] != initial_status

    # Toggle back
    toggle_back = client.patch(
        f"/api/v1/rules/{rule_id}/toggle?actor=compliance-admin@bank.com",
        json={"is_active": initial_status},
    )
    assert toggle_back.status_code == 200
    assert toggle_back.json()["is_active"] == initial_status


def test_invalid_rule_parameter_validation(client: TestClient):
    bad_payload = {
        "name": "Invalid Negative Threshold",
        "rule_type": "AMOUNT_THRESHOLD",
        "severity": "HIGH",
        "parameters": {"threshold_amount": -100.0},
    }
    resp = client.post("/api/v1/rules", json=bad_payload)
    assert resp.status_code == 400
    assert "threshold_amount must be greater than 0" in resp.json()["detail"]
