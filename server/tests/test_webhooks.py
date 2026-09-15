def test_webhook_payment_intent_succeeded(client):
    # Setup checkout session
    checkout_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 80.0,
            "currency": "USD",
            "customer_email": "webhook_succ@example.com",
        },
    )
    pi_id = checkout_res.json()["payment_intent_id"]

    webhook_payload = {
        "id": "evt_test_succeeded_001",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": pi_id,
                "amount": 8000,
                "currency": "usd",
                "status": "succeeded",
            }
        },
    }

    res = client.post(
        "/api/v1/webhooks/stripe",
        json=webhook_payload,
        headers={"stripe-signature": "t=12345,v1=valid"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "success"


def test_webhook_payment_intent_failed(client):
    checkout_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 35.0,
            "currency": "USD",
            "customer_email": "webhook_fail@example.com",
        },
    )
    pi_id = checkout_res.json()["payment_intent_id"]
    txs = client.get(
        "/api/v1/payments/transactions?search=webhook_fail@example.com"
    ).json()
    tx_id = txs[0]["id"]

    webhook_payload = {
        "id": "evt_test_failed_002",
        "type": "payment_intent.payment_failed",
        "data": {
            "object": {
                "id": pi_id,
                "amount": 3500,
                "currency": "usd",
                "status": "failed",
            }
        },
    }

    res = client.post(
        "/api/v1/webhooks/stripe",
        json=webhook_payload,
    )
    assert res.status_code == 200

    tx_detail = client.get(f"/api/v1/payments/transactions/{tx_id}").json()
    assert tx_detail["status"] == "FAILED"


def test_webhook_idempotency(client):
    webhook_payload = {
        "id": "evt_duplicate_test_123",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_nonexistent_or_mock",
            }
        },
    }

    # First delivery
    res1 = client.post("/api/v1/webhooks/stripe", json=webhook_payload)
    assert res1.status_code == 200
    assert res1.json()["status"] == "success"

    # Second (duplicate) delivery
    res2 = client.post("/api/v1/webhooks/stripe", json=webhook_payload)
    assert res2.status_code == 200
    assert res2.json()["status"] == "duplicate"


def test_webhook_invalid_signature(client):
    webhook_payload = {
        "id": "evt_sig_test_999",
        "type": "payment_intent.succeeded",
        "data": {},
    }

    res = client.post(
        "/api/v1/webhooks/stripe",
        json=webhook_payload,
        headers={"stripe-signature": "invalid_signature"},
    )
    assert res.status_code == 401
    assert "invalid stripe webhook signature" in res.json()["detail"].lower()
