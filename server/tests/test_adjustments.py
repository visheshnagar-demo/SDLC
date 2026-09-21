def test_audit_logging_and_reason_codes(client):
    # Create item
    item_res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-AUDIT-01",
            "name": "Patrol Shield",
            "category": "Protection",
            "unit_price": 300.0,
            "reorder_threshold": 5,
            "reorder_quantity": 10,
        },
    )
    item_id = item_res.json()["id"]

    # Initial stock in
    client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "quantity_delta": 20,
            "reason_code": "STOCK_INBOUND",
            "notes": "Initial stock",
        },
    )

    # Damage adjustment
    dmg_res = client.post(
        f"/api/v1/inventory/{item_id}/adjust",
        json={
            "quantity_delta": -2,
            "reason_code": "DAMAGED_GOODS",
            "notes": "2 units damaged during inspection",
        },
    )
    assert dmg_res.status_code == 201
    data = dmg_res.json()
    assert data["previous_quantity"] == 20
    assert data["quantity_delta"] == -2
    assert data["new_quantity"] == 18
    assert data["reason_code"] == "DAMAGED_GOODS"

    # Query audit logs
    audit_res = client.get(f"/api/v1/inventory/audit-logs?item_id={item_id}")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 2
    reasons = [l["reason_code"] for l in logs]
    assert "DAMAGED_GOODS" in reasons
    assert "STOCK_INBOUND" in reasons


def test_adjustments_direct_endpoint(client):
    item_res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-DIRECT-01",
            "name": "Baton",
            "category": "Tools",
            "unit_price": 35.0,
            "reorder_threshold": 5,
            "reorder_quantity": 15,
        },
    )
    item_id = item_res.json()["id"]

    adj_res = client.post(
        "/api/v1/adjustments",
        json={
            "item_id": item_id,
            "quantity_delta": 10,
            "reason_code": "RECONCILIATION",
            "notes": "Physical count match",
        },
    )
    assert adj_res.status_code == 201
    assert adj_res.json()["new_quantity"] == 10

    list_res = client.get(f"/api/v1/adjustments?item_id={item_id}")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
