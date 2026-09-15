def test_get_membership_plans(client):
    response = client.get("/api/v1/memberships/plans")
    assert response.status_code == 200
    plans = response.json()
    assert len(plans) >= 3
    plan_codes = [p["code"] for p in plans]
    assert "DAY_PASS" in plan_codes
    assert "MONTHLY_STD" in plan_codes
    assert "ANNUAL_PREM" in plan_codes


def test_get_my_membership(client, member_auth_headers):
    response = client.get("/api/v1/memberships/me", headers=member_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ACTIVE"
    assert data["plan"] is not None
    assert data["plan"]["code"] == "MONTHLY_STD"


def test_subscribe_new_plan(client, member_auth_headers):
    plans_res = client.get("/api/v1/memberships/plans")
    assert plans_res.status_code == 200
    annual_plan = next(p for p in plans_res.json() if p["code"] == "ANNUAL_PREM")

    subscribe_res = client.post(
        "/api/v1/memberships/subscribe",
        headers=member_auth_headers,
        json={"plan_id": annual_plan["id"]},
    )
    assert subscribe_res.status_code == 201
    data = subscribe_res.json()
    assert data["status"] == "ACTIVE"
    assert data["plan_id"] == annual_plan["id"]

    # Verify updated plan
    my_res = client.get("/api/v1/memberships/me", headers=member_auth_headers)
    assert my_res.status_code == 200
    assert my_res.json()["plan_id"] == annual_plan["id"]


def test_subscribe_invalid_plan(client, member_auth_headers):
    res = client.post(
        "/api/v1/memberships/subscribe",
        headers=member_auth_headers,
        json={"plan_id": "non-existent-plan-id"},
    )
    assert res.status_code == 404
