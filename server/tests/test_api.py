def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_get_kpis(client):
    response = client.get("/api/v1/kpis?cluster_name=Small Town Value Cluster")
    assert response.status_code == 200
    data = response.json()
    assert data["cluster_name"] == "Small Town Value Cluster"
    assert data["sales_per_linear_ft"] == 145.50
    assert data["private_brand_share_pct"] == 28.5
    assert data["in_stock_rate_pct"] == 96.2
    assert data["shelf_capacity_utilization_pct"] == 92.0


def test_get_kpis_not_found(client):
    response = client.get("/api/v1/kpis?cluster_name=NonExistentCluster")
    assert response.status_code == 404


def test_list_skus_all(client):
    response = client.get("/api/v1/skus")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 21
    assert any(item["sku_code"] == "SNK-10042" for item in data)


def test_list_skus_filtered_by_status(client):
    response = client.get("/api/v1/skus?status_badge=GROW")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert all(item["status_badge"] == "GROW" for item in data)

    response_swap = client.get("/api/v1/skus?status_badge=SWAP")
    assert response_swap.status_code == 200
    data_swap = response_swap.json()
    assert len(data_swap) == 3
    assert all(item["status_badge"] == "SWAP" for item in data_swap)


def test_list_skus_filtered_by_brand(client):
    response = client.get("/api/v1/skus?is_private_brand=true")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert all(item["is_private_brand"] is True for item in data)


def test_list_skus_search(client):
    response = client.get("/api/v1/skus?search=Pretzels")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any("Pretzels" in item["name"] for item in data)


def test_list_skus_sorting(client):
    response = client.get("/api/v1/skus?sort_by=sales_per_linear_ft&sort_order=desc")
    assert response.status_code == 200
    data = response.json()
    sales_values = [item["sales_per_linear_ft"] for item in data]
    assert sales_values == sorted(sales_values, reverse=True)


def test_get_sku_by_code(client):
    response = client.get("/api/v1/skus/SNK-10042")
    assert response.status_code == 200
    data = response.json()
    assert data["sku_code"] == "SNK-10042"
    assert data["name"] == "DG Brand Potato Chips 10oz"
    assert data["is_private_brand"] is True
    assert data["status_badge"] == "GROW"


def test_get_sku_not_found(client):
    response = client.get("/api/v1/skus/INVALID-SKU-99999")
    assert response.status_code == 404


def test_create_and_update_sku(client):
    # Create new SKU
    new_sku_data = {
        "sku_code": "SNK-TEST-999",
        "name": "Test Roasted Peanuts 5oz",
        "category": "Snacks",
        "weekly_unit_sales": 120,
        "sales_per_linear_ft": 95.0,
        "margin_pct": 28.0,
        "space_allocation_ft": 1.0,
        "is_private_brand": True,
        "status_badge": "MAINTAIN"
    }
    create_resp = client.post("/api/v1/skus", json=new_sku_data)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["sku_code"] == "SNK-TEST-999"
    sku_id = created["id"]

    # Update SKU
    update_data = {
        "status_badge": "GROW",
        "weekly_unit_sales": 180
    }
    update_resp = client.put(f"/api/v1/skus/{sku_id}", json=update_data)
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["status_badge"] == "GROW"
    assert updated["weekly_unit_sales"] == 180


def test_get_scenarios(client):
    response = client.get("/api/v1/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    codes = [s["code"] for s in data]
    assert "CONSERVATIVE" in codes
    assert "BALANCED" in codes
    assert "AGGRESSIVE" in codes

    balanced = next(s for s in data if s["code"] == "BALANCED")
    assert balanced["is_default"] is True
    assert balanced["projected_sales_growth_pct"] == 4.2
    assert balanced["projected_private_brand_share_pct"] == 29.5


def test_evaluate_scenario(client):
    eval_req = {
        "scenario_code": "BALANCED",
        "cluster_name": "Small Town Value Cluster"
    }
    response = client.post("/api/v1/scenarios/evaluate", json=eval_req)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_code"] == "BALANCED"
    assert data["projected_sales_growth_pct"] == 4.2
    assert len(data["guardrails"]) == 2
    assert all(g["passed"] is True for g in data["guardrails"])


def test_submit_approval(client):
    submit_req = {
        "scenario_code": "BALANCED",
        "cluster_name": "Small Town Value Cluster",
        "manager_id": "MGR-8842",
        "override_comments": None
    }
    response = client.post("/api/v1/approvals/submit", json=submit_req)
    assert response.status_code == 201
    data = response.json()
    assert data["audit_id"].startswith("AUD-")
    assert data["manager_id"] == "MGR-8842"
    assert data["scenario_applied"] == "Balanced"
    assert data["total_sku_actions"] == 21
    assert data["status"] == "APPROVED"
    assert len(data["guardrails"]) == 2

    audit_id = data["audit_id"]

    # Retrieve by audit ID
    get_resp = client.get(f"/api/v1/approvals/{audit_id}")
    assert get_resp.status_code == 200
    get_data = get_resp.json()
    assert get_data["audit_id"] == audit_id

    # List history
    hist_resp = client.get("/api/v1/approvals/history")
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert any(item["audit_id"] == audit_id for item in hist_data)


def test_submit_approval_invalid_scenario(client):
    submit_req = {
        "scenario_code": "INVALID_SCENARIO",
        "cluster_name": "Small Town Value Cluster",
        "manager_id": "MGR-8842"
    }
    response = client.post("/api/v1/approvals/submit", json=submit_req)
    assert response.status_code == 404
