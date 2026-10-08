import uuid
import pytest
from fastapi.testclient import TestClient
from server.models import SavingsAccount, FixedDepositAccount, TransactionLedger


def test_get_savings_accounts_eligibility(client: TestClient):
    """Test retrieving savings accounts and verifying eligibility logic."""
    response = client.get("/api/v1/savings-accounts")
    assert response.status_code == 200
    data = response.json()
    assert "accounts" in data
    assert len(data["accounts"]) >= 2

    # Primary account has $10,000 balance -> eligible
    primary = next((acc for acc in data["accounts"] if acc["account_number"] == "XXXX-1234"), None)
    assert primary is not None
    assert primary["available_balance"] == 10000.00
    assert primary["is_eligible_for_fd"] is True
    assert primary["ineligibility_reason"] is None

    # Secondary account has $250 balance (< $500 minimum) -> ineligible
    secondary = next((acc for acc in data["accounts"] if acc["account_number"] == "XXXX-5678"), None)
    assert secondary is not None
    assert secondary["available_balance"] == 250.00
    assert secondary["is_eligible_for_fd"] is False
    assert "Insufficient balance" in secondary["ineligibility_reason"]

    # Dormant account -> ineligible
    dormant = next((acc for acc in data["accounts"] if acc["account_number"] == "XXXX-9999"), None)
    if dormant:
        assert dormant["is_eligible_for_fd"] is False
        assert "inactive" in dormant["ineligibility_reason"] or "status" in dormant["ineligibility_reason"]


def test_get_fd_rates_and_calculation(client: TestClient):
    """Test retrieving rate slabs and calculating interest/maturity."""
    # 1. Fetch plans without projection params
    response = client.get("/api/v1/fixed-deposits/rates")
    assert response.status_code == 200
    data = response.json()
    assert "plans" in data
    assert len(data["plans"]) >= 4

    # Verify standard tenures
    tenures = [p["tenure_months"] for p in data["plans"]]
    assert 6 in tenures
    assert 12 in tenures
    assert 24 in tenures
    assert 36 in tenures

    # 2. Fetch with calculation params
    calc_res = client.get(
        "/api/v1/fixed-deposits/rates?deposit_amount=5000&tenure_months=12&payout_frequency=AT_MATURITY"
    )
    assert calc_res.status_code == 200
    calc_data = calc_res.json()
    assert calc_data["calculation"] is not None
    calc = calc_data["calculation"]
    assert calc["deposit_amount"] == 5000.00
    assert calc["tenure_months"] == 12
    assert calc["interest_rate"] == 5.50
    assert calc["total_interest_earned"] == 275.00
    assert calc["maturity_amount"] == 5275.00
    assert "maturity_date" in calc


def test_create_fixed_deposit_success(client: TestClient, db_session):
    """Test successful fixed deposit creation, balance deduction, and receipt generation."""
    # Find primary savings account
    primary_acc = db_session.query(SavingsAccount).filter(SavingsAccount.account_number == "XXXX-1234").first()
    assert primary_acc is not None
    initial_balance = primary_acc.balance

    deposit_amount = 5000.00
    payload = {
        "source_account_id": primary_acc.id,
        "deposit_amount": deposit_amount,
        "tenure_months": 12,
        "payout_frequency": "AT_MATURITY",
        "transaction_pin": "1234",
    }
    idempotency_key = str(uuid.uuid4())

    response = client.post(
        "/api/v1/fixed-deposits",
        json=payload,
        headers={"Idempotency-Key": idempotency_key},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "fixed_deposit" in data
    assert "receipt" in data

    fd = data["fixed_deposit"]
    assert fd["deposit_amount"] == 5000.00
    assert fd["interest_rate"] == 5.50
    assert fd["tenure_months"] == 12
    assert fd["maturity_amount"] == 5275.00
    assert fd["status"] == "ACTIVE"
    assert fd["fd_account_number"].startswith("FD-")

    # Verify receipt details
    receipt = data["receipt"]
    assert receipt["receipt_number"].startswith("REC-FD-")
    assert f"/api/v1/fixed-deposits/{fd['id']}/receipt" in receipt["download_url"]

    # Verify DB state: savings balance deducted
    db_session.refresh(primary_acc)
    assert primary_acc.balance == round(initial_balance - deposit_amount, 2)

    # Verify ledger debit entry
    ledger = db_session.query(TransactionLedger).filter(
        TransactionLedger.account_id == primary_acc.id,
        TransactionLedger.reference_id == fd["id"],
    ).first()
    assert ledger is not None
    assert ledger.transaction_type == "DEBIT"
    assert ledger.amount == deposit_amount
    assert ledger.balance_after == primary_acc.balance


def test_create_fixed_deposit_idempotency(client: TestClient, db_session):
    """Test that repeating request with the same Idempotency-Key does not double-debit."""
    primary_acc = db_session.query(SavingsAccount).filter(SavingsAccount.account_number == "XXXX-1234").first()
    initial_balance = primary_acc.balance

    deposit_amount = 1000.00
    payload = {
        "source_account_id": primary_acc.id,
        "deposit_amount": deposit_amount,
        "tenure_months": 6,
        "payout_frequency": "AT_MATURITY",
        "transaction_pin": "1234",
    }
    idempotency_key = "idemp-" + str(uuid.uuid4())

    # First call
    res1 = client.post(
        "/api/v1/fixed-deposits",
        json=payload,
        headers={"Idempotency-Key": idempotency_key},
    )
    assert res1.status_code == 201
    fd_id_1 = res1.json()["fixed_deposit"]["id"]

    db_session.refresh(primary_acc)
    balance_after_first = primary_acc.balance
    assert balance_after_first == round(initial_balance - deposit_amount, 2)

    # Second call with SAME idempotency key
    res2 = client.post(
        "/api/v1/fixed-deposits",
        json=payload,
        headers={"Idempotency-Key": idempotency_key},
    )
    assert res2.status_code == 201
    assert res2.json()["fixed_deposit"]["id"] == fd_id_1

    # Verify balance was NOT debited a second time
    db_session.refresh(primary_acc)
    assert primary_acc.balance == balance_after_first


def test_create_fixed_deposit_invalid_pin(client: TestClient, db_session):
    """Test that invalid PIN returns 403 Forbidden and rolls back."""
    primary_acc = db_session.query(SavingsAccount).filter(SavingsAccount.account_number == "XXXX-1234").first()
    initial_balance = primary_acc.balance

    payload = {
        "source_account_id": primary_acc.id,
        "deposit_amount": 500.00,
        "tenure_months": 12,
        "payout_frequency": "AT_MATURITY",
        "transaction_pin": "9999",  # WRONG PIN
    }

    response = client.post("/api/v1/fixed-deposits", json=payload)
    assert response.status_code == 403
    assert "Invalid transaction PIN" in response.json()["detail"]

    # Verify balance unchanged
    db_session.refresh(primary_acc)
    assert primary_acc.balance == initial_balance


def test_create_fixed_deposit_below_minimum(client: TestClient, db_session):
    """Test that deposit amount < $500 returns 400 Bad Request."""
    primary_acc = db_session.query(SavingsAccount).filter(SavingsAccount.account_number == "XXXX-1234").first()

    payload = {
        "source_account_id": primary_acc.id,
        "deposit_amount": 499.00,  # Below $500 min
        "tenure_months": 12,
        "payout_frequency": "AT_MATURITY",
        "transaction_pin": "1234",
    }

    response = client.post("/api/v1/fixed-deposits", json=payload)
    assert response.status_code == 400
    assert "at least $500.00" in response.json()["detail"]


def test_create_fixed_deposit_invalid_tenure(client: TestClient, db_session):
    """Test that unsupported tenure returns 400 Bad Request."""
    primary_acc = db_session.query(SavingsAccount).filter(SavingsAccount.account_number == "XXXX-1234").first()

    payload = {
        "source_account_id": primary_acc.id,
        "deposit_amount": 1000.00,
        "tenure_months": 7,  # Unsupported tenure
        "payout_frequency": "AT_MATURITY",
        "transaction_pin": "1234",
    }

    response = client.post("/api/v1/fixed-deposits", json=payload)
    assert response.status_code == 400
    assert "Invalid tenure duration" in response.json()["detail"]


def test_create_fixed_deposit_insufficient_balance(client: TestClient, db_session):
    """Test that insufficient funds in source account returns 422."""
    secondary_acc = db_session.query(SavingsAccount).filter(SavingsAccount.account_number == "XXXX-5678").first()

    payload = {
        "source_account_id": secondary_acc.id,
        "deposit_amount": 1000.00,  # secondary_acc balance is only $250
        "tenure_months": 12,
        "payout_frequency": "AT_MATURITY",
        "transaction_pin": "1234",
    }

    response = client.post("/api/v1/fixed-deposits", json=payload)
    assert response.status_code == 422
    assert "Insufficient available funds" in response.json()["detail"]


def test_create_fixed_deposit_dormant_account(client: TestClient, db_session):
    """Test that inactive/dormant source account returns 422."""
    dormant_acc = db_session.query(SavingsAccount).filter(SavingsAccount.account_number == "XXXX-9999").first()

    payload = {
        "source_account_id": dormant_acc.id,
        "deposit_amount": 1000.00,
        "tenure_months": 12,
        "payout_frequency": "AT_MATURITY",
        "transaction_pin": "1234",
    }

    response = client.post("/api/v1/fixed-deposits", json=payload)
    assert response.status_code == 422
    assert "not active" in response.json()["detail"]


def test_download_fd_advice_receipt_pdf(client: TestClient, db_session):
    """Test downloading the generated PDF receipt."""
    primary_acc = db_session.query(SavingsAccount).filter(SavingsAccount.account_number == "XXXX-1234").first()

    payload = {
        "source_account_id": primary_acc.id,
        "deposit_amount": 2000.00,
        "tenure_months": 24,
        "payout_frequency": "AT_MATURITY",
        "transaction_pin": "1234",
    }

    create_res = client.post("/api/v1/fixed-deposits", json=payload)
    assert create_res.status_code == 201
    fd_id = create_res.json()["fixed_deposit"]["id"]

    # Download receipt
    receipt_res = client.get(f"/api/v1/fixed-deposits/{fd_id}/receipt")
    assert receipt_res.status_code == 200
    assert receipt_res.headers["content-type"] == "application/pdf"
    assert len(receipt_res.content) > 100
    assert receipt_res.content.startswith(b"%PDF")


def test_list_and_get_fixed_deposits(client: TestClient, db_session):
    """Test listing all fixed deposits and fetching details."""
    list_res = client.get("/api/v1/fixed-deposits")
    assert list_res.status_code == 200
    fds = list_res.json()
    assert len(fds) >= 1

    first_fd_id = fds[0]["id"]
    detail_res = client.get(f"/api/v1/fixed-deposits/{first_fd_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == first_fd_id

    # Non-existent FD
    missing_res = client.get(f"/api/v1/fixed-deposits/{str(uuid.uuid4())}")
    assert missing_res.status_code == 404
