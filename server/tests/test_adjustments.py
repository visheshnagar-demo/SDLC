def test_audit_logs(client):
    # Create item
    item_res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-AUDIT-01",
            "name": "Audit Test Baton",
            "unit_price": 45.0,
            "reorder_threshold": 10,
            "reorder_quantity": 20,
        },
    )
    item_id = item_res.json()["id"]

    # Record adjustment via /api/v1/stock-adjustments
    adj_res = client.post(
        "/api/v1/stock-adjustments",
        json={
            "item_id": item_id,
            "warehouse_id": "WH-WEST",
            "quantity_delta": 25,
            "reason_code": "RECONCILIATION",
            "notes": "Found extra box in storage",
        },
    )
    assert adj_res.status_code == 201
    assert adj_res.json()["reason_code"] == "RECONCILIATION"

    # Query audit logs via /api/v1/inventory/audit-logs
    logs_res = client.get(f"/api/v1/inventory/audit-logs?item_id={item_id}")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 1
    assert logs[0]["reason_code"] == "RECONCILIATION"
    assert logs[0]["sku"] == "SKU-AUDIT-01"
    assert logs[0]["warehouse_name"] == "West Coast Facility"
