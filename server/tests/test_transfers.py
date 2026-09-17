def test_allocate_and_transfer_and_redeem(client):
    acc_res = client.get("/api/v1/accounts")
    accounts = acc_res.json()
    test_user = next(a for a in accounts if a["owner_email"] == "test@example.com")
    user_b = next(a for a in accounts if a["owner_email"] == "userb@example.com")

    chips_res = client.get("/api/v1/chips")
    chip_gold = next(c for c in chips_res.json() if c["name"] == "Gold 100")

    alloc_payload = {
        "target_account_id": test_user["id"],
        "chip_id": chip_gold["id"],
        "amount": 200,
        "reason": "Test allocation",
    }
    alloc_res = client.post("/api/v1/transfers/allocate", json=alloc_payload)
    assert alloc_res.status_code == 201
    assert alloc_res.json()["transaction_type"] == "allocate"

    transfer_payload = {
        "source_account_id": test_user["id"],
        "destination_account_id": user_b["id"],
        "chip_id": chip_gold["id"],
        "amount": 100,
        "reason": "Test transfer",
    }
    xfer_res = client.post("/api/v1/transfers/transfer", json=transfer_payload)
    assert xfer_res.status_code == 200
    assert xfer_res.json()["transaction_type"] == "transfer"

    redeem_payload = {
        "account_id": user_b["id"],
        "chip_id": chip_gold["id"],
        "amount": 50,
        "reason": "Test redemption",
    }
    red_res = client.post("/api/v1/transfers/redeem", json=redeem_payload)
    assert red_res.status_code == 200
    assert red_res.json()["transaction_type"] == "redeem"


def test_adjust_chips(client):
    acc_res = client.get("/api/v1/accounts")
    test_user = acc_res.json()[0]

    chips_res = client.get("/api/v1/chips")
    chip_gold = chips_res.json()[0]

    adjust_payload = {
        "account_id": test_user["id"],
        "chip_id": chip_gold["id"],
        "amount": 150,
        "reason": "Audit correction",
    }
    adj_res = client.post("/api/v1/transfers/adjust", json=adjust_payload)
    assert adj_res.status_code == 200
    assert adj_res.json()["transaction_type"] == "adjustment"


def test_allocate_exceeds_stock(client):
    acc_res = client.get("/api/v1/accounts")
    test_user = acc_res.json()[0]

    chips_res = client.get("/api/v1/chips")
    chip_gold = next(c for c in chips_res.json() if c["name"] == "Gold 100")

    alloc_payload = {
        "target_account_id": test_user["id"],
        "chip_id": chip_gold["id"],
        "amount": 9999999,
        "reason": "Excessive allocation",
    }
    res = client.post("/api/v1/transfers/allocate", json=alloc_payload)
    assert res.status_code == 400
    assert "Insufficient inventory stock" in res.json()["detail"]


def test_transfer_insufficient_balance(client):
    acc_res = client.get("/api/v1/accounts")
    accounts = acc_res.json()
    user_a = accounts[0]
    user_b = accounts[1]

    chips_res = client.get("/api/v1/chips")
    chip_gold = chips_res.json()[0]

    transfer_payload = {
        "source_account_id": user_a["id"],
        "destination_account_id": user_b["id"],
        "chip_id": chip_gold["id"],
        "amount": 9999999,
        "reason": "Excessive transfer",
    }
    res = client.post("/api/v1/transfers/transfer", json=transfer_payload)
    assert res.status_code == 400
    assert "Insufficient chip balance" in res.json()["detail"]
