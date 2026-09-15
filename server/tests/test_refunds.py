def test_full_refund(client):
    # Create transaction
    checkout_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 50.0,
            "currency": "USD",
            "customer_email": "full_refund@example.com",
        },
    )
    assert checkout_res.status_code == 200

    txs = client.get(
        "/api/v1/payments/transactions?search=full_refund@example.com"
    ).json()
    tx_id = txs[0]["id"]

    # Issue full refund
    refund_payload = {
        "transaction_id": tx_id,
        "amount": 50.0,
        "reason": "Customer Request",
        "memo": "Full refund test",
    }
    refund_res = client.post("/api/v1/refunds", json=refund_payload)
    assert refund_res.status_code == 200
    ref_data = refund_res.json()
    assert ref_data["refund_amount"] == 50.0
    assert ref_data["status"] == "COMPLETED"

    # Verify transaction status is now REFUNDED
    tx_detail = client.get(f"/api/v1/payments/transactions/{tx_id}").json()
    assert tx_detail["status"] == "REFUNDED"
    assert tx_detail["refunded_amount"] == 50.0
    assert tx_detail["remaining_refundable_balance"] == 0.0
    assert len(tx_detail["refunds"]) == 1


def test_partial_refund(client):
    # Create transaction
    checkout_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 100.0,
            "currency": "USD",
            "customer_email": "partial_refund@example.com",
        },
    )
    assert checkout_res.status_code == 200

    txs = client.get(
        "/api/v1/payments/transactions?search=partial_refund@example.com"
    ).json()
    tx_id = txs[0]["id"]

    # Partial refund 1: 30.00
    res1 = client.post(
        "/api/v1/refunds",
        json={"transaction_id": tx_id, "amount": 30.0, "reason": "Dissatisfaction"},
    )
    assert res1.status_code == 200

    tx_detail1 = client.get(f"/api/v1/payments/transactions/{tx_id}").json()
    assert tx_detail1["status"] == "PARTIALLY_REFUNDED"
    assert tx_detail1["refunded_amount"] == 30.0
    assert tx_detail1["remaining_refundable_balance"] == 70.0

    # Partial refund 2: 70.00 (finishes it)
    res2 = client.post(
        "/api/v1/refunds",
        json={"transaction_id": tx_id, "amount": 70.0, "reason": "Remaining balance"},
    )
    assert res2.status_code == 200

    tx_detail2 = client.get(f"/api/v1/payments/transactions/{tx_id}").json()
    assert tx_detail2["status"] == "REFUNDED"
    assert tx_detail2["refunded_amount"] == 100.0
    assert tx_detail2["remaining_refundable_balance"] == 0.0
    assert len(tx_detail2["refunds"]) == 2


def test_refund_exceeding_balance(client):
    checkout_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 25.0,
            "currency": "USD",
            "customer_email": "exceed@example.com",
        },
    )
    assert checkout_res.status_code == 200
    txs = client.get("/api/v1/payments/transactions?search=exceed@example.com").json()
    tx_id = txs[0]["id"]

    res = client.post(
        "/api/v1/refunds",
        json={"transaction_id": tx_id, "amount": 30.0, "reason": "Too much"},
    )
    assert res.status_code == 400
    assert "exceeds remaining balance" in res.json()["detail"].lower()


def test_refund_nonexistent_transaction(client):
    res = client.post(
        "/api/v1/refunds",
        json={"transaction_id": "tx_nonexistent", "amount": 10.0, "reason": "Ghost tx"},
    )
    assert res.status_code == 400
    assert "not found" in res.json()["detail"].lower()


def test_list_refunds(client):
    checkout_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 40.0,
            "currency": "USD",
            "customer_email": "list_ref@example.com",
        },
    )
    assert checkout_res.status_code == 200
    txs = client.get("/api/v1/payments/transactions?search=list_ref@example.com").json()
    tx_id = txs[0]["id"]

    client.post(
        "/api/v1/refunds",
        json={"transaction_id": tx_id, "amount": 15.0, "reason": "Partial 1"},
    )

    list_res = client.get(f"/api/v1/refunds?transaction_id={tx_id}")
    assert list_res.status_code == 200
    data = list_res.json()
    assert len(data) >= 1
    assert data[0]["transaction_id"] == tx_id
    assert data[0]["refund_amount"] == 15.0
