def test_allocation_and_transfer_workflow(client):
    # 1. Create chip definition
    chip_resp = client.post(
        "/api/v1/chips",
        json={
            "name": "Tournament Chip 500",
            "category": "Special",
            "face_value": 500.0,
        },
    )
    chip_id = chip_resp.json()["id"]

    # 2. Add inventory batch of 1000 chips
    client.post(
        f"/api/v1/chips/{chip_id}/batches",
        json={"batch_number": "BATCH-TOURNAMENT-001", "total_quantity": 1000},
    )

    # 3. Create two accounts
    acc1_resp = client.post(
        "/api/v1/accounts",
        json={
            "account_number": "ACC-PLAYER-1",
            "owner_name": "Player One",
            "owner_email": "p1@example.com",
        },
    )
    acc1_id = acc1_resp.json()["id"]

    acc2_resp = client.post(
        "/api/v1/accounts",
        json={
            "account_number": "ACC-PLAYER-2",
            "owner_name": "Player Two",
            "owner_email": "p2@example.com",
        },
    )
    acc2_id = acc2_resp.json()["id"]

    # 4. Allocate 400 chips to Player 1
    alloc_resp = client.post(
        "/api/v1/transfers/allocate",
        json={
            "account_id": acc1_id,
            "chip_id": chip_id,
            "amount": 400,
            "reason": "Initial tournament allocation",
        },
    )
    assert alloc_resp.status_code == 200
    assert alloc_resp.json()["destination_balance_after"] == 400

    # 5. Transfer 150 chips from Player 1 to Player 2
    transfer_resp = client.post(
        "/api/v1/transfers/transfer",
        json={
            "source_account_id": acc1_id,
            "destination_account_id": acc2_id,
            "chip_id": chip_id,
            "amount": 150,
            "reason": "Peer-to-peer tournament bet",
        },
    )
    assert transfer_resp.status_code == 200
    assert transfer_resp.json()["source_balance_after"] == 250
    assert transfer_resp.json()["destination_balance_after"] == 150

    # 6. Redeem 50 chips from Player 2
    redeem_resp = client.post(
        "/api/v1/transfers/redeem",
        json={
            "account_id": acc2_id,
            "chip_id": chip_id,
            "amount": 50,
            "reason": "Cashout at cashier cage",
        },
    )
    assert redeem_resp.status_code == 200
    assert redeem_resp.json()["source_balance_after"] == 100


def test_allocation_exceeding_stock_fails(client):
    chip_resp = client.post(
        "/api/v1/chips",
        json={"name": "Limited Chip 5000", "category": "Limited", "face_value": 5000.0},
    )
    chip_id = chip_resp.json()["id"]

    client.post(
        f"/api/v1/chips/{chip_id}/batches",
        json={"batch_number": "BATCH-LIMITED-001", "total_quantity": 100},
    )

    acc_resp = client.post(
        "/api/v1/accounts",
        json={
            "account_number": "ACC-LIMITED-1",
            "owner_name": "Limited User",
            "owner_email": "limited@example.com",
        },
    )
    acc_id = acc_resp.json()["id"]

    # Try allocating 500 chips when only 100 are available
    alloc_resp = client.post(
        "/api/v1/transfers/allocate",
        json={
            "account_id": acc_id,
            "chip_id": chip_id,
            "amount": 500,
            "reason": "Over allocation test",
        },
    )
    assert alloc_resp.status_code == 400


def test_transfer_insufficient_balance_fails(client):
    # Create two accounts
    acc1_resp = client.post(
        "/api/v1/accounts",
        json={
            "account_number": "ACC-FAIL-1",
            "owner_name": "Fail One",
            "owner_email": "fail1@example.com",
        },
    )
    acc1_id = acc1_resp.json()["id"]

    acc2_resp = client.post(
        "/api/v1/accounts",
        json={
            "account_number": "ACC-FAIL-2",
            "owner_name": "Fail Two",
            "owner_email": "fail2@example.com",
        },
    )
    acc2_id = acc2_resp.json()["id"]

    # Get a chip
    chips = client.get("/api/v1/chips").json()
    chip_id = chips[0]["id"]

    transfer_resp = client.post(
        "/api/v1/transfers/transfer",
        json={
            "source_account_id": acc1_id,
            "destination_account_id": acc2_id,
            "chip_id": chip_id,
            "amount": 9999999,
            "reason": "Excessive transfer",
        },
    )
    assert transfer_resp.status_code == 400
