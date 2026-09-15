def test_audit_logs_list_and_masking(client):
    # Perform checkout
    checkout_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 99.0,
            "currency": "USD",
            "customer_email": "audit_test@example.com",
            "items": [{"name": "Test Product", "quantity": 1, "unit_price": 99.0}],
        },
    )
    assert checkout_res.status_code == 200

    txs = client.get(
        "/api/v1/payments/transactions?search=audit_test@example.com"
    ).json()
    tx_id = txs[0]["id"]

    # Issue refund to generate refund audit log
    client.post(
        "/api/v1/refunds",
        json={"transaction_id": tx_id, "amount": 10.0, "reason": "Audit refund check"},
    )

    # Fetch audit logs for this transaction
    logs_res = client.get(f"/api/v1/audit-logs?transaction_id={tx_id}")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 2

    event_types = [log["event_type"] for log in logs]
    assert "checkout.session.created" in event_types
    assert "charge.refunded" in event_types

    # Verify no raw PAN / CVV in masked payloads
    for log in logs:
        payload_str = str(log["masked_payload"]).lower()
        assert "4242424242424242" not in payload_str


def test_audit_logs_filter_by_event(client):
    res = client.get("/api/v1/audit-logs?event_type=checkout.session.created")
    assert res.status_code == 200
    logs = res.json()
    for log in logs:
        assert log["event_type"] == "checkout.session.created"
