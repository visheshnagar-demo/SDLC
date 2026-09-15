def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_checkout_session_usd(client):
    payload = {
        "amount": 49.99,
        "currency": "USD",
        "customer_email": "customer@example.com",
        "items": [{"name": "Pro Subscription", "quantity": 1, "unit_price": 49.99}],
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "payment_intent_id" in data
    assert "client_secret" in data
    assert data["base_amount"] == 49.99
    assert data["base_currency"] == "USD"
    assert data["target_amount"] == 49.99
    assert data["target_currency"] == "USD"
    assert data["exchange_rate"] == 1.0


def test_create_checkout_session_eur(client):
    payload = {
        "amount": 100.0,
        "currency": "EUR",
        "customer_email": "customer_eur@example.com",
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["target_currency"] == "EUR"
    assert data["target_amount"] == 92.5
    assert data["exchange_rate"] == 0.925


def test_create_checkout_session_invalid_currency(client):
    payload = {
        "amount": 100.0,
        "currency": "XYZ",
        "customer_email": "invalid@example.com",
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"].lower()


def test_digital_wallet_apple_pay(client):
    payload = {
        "wallet_type": "apple_pay",
        "payment_token": "tok_wallet_apple_pay_valid_123",
        "currency": "USD",
        "amount": 49.99,
        "customer_email": "applepay@example.com",
    }
    response = client.post("/api/v1/payments/digital-wallet", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["wallet_type"] == "apple_pay"
    assert data["amount"] == 49.99
    assert data["status"] == "COMPLETED"
    assert "transaction_id" in data


def test_digital_wallet_google_pay(client):
    payload = {
        "wallet_type": "google_pay",
        "payment_token": "tok_wallet_google_pay_valid_456",
        "currency": "EUR",
        "amount": 100.0,
        "customer_email": "googlepay@example.com",
    }
    response = client.post("/api/v1/payments/digital-wallet", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["wallet_type"] == "google_pay"
    assert data["currency"] == "EUR"
    assert data["amount"] == 92.5
    assert data["status"] == "COMPLETED"


def test_digital_wallet_invalid_token(client):
    payload = {
        "wallet_type": "apple_pay",
        "payment_token": "tok_invalid_12345",
        "currency": "USD",
        "amount": 49.99,
    }
    response = client.post("/api/v1/payments/digital-wallet", json=payload)
    assert response.status_code == 422
    assert "invalid or has expired" in response.json()["detail"].lower()


def test_get_exchange_rates(client):
    response = client.get("/api/v1/payments/rates?base_currency=USD")
    assert response.status_code == 200
    data = response.json()
    assert data["base_currency"] == "USD"
    assert "rates" in data
    assert data["rates"]["USD"] == 1.0
    assert data["rates"]["EUR"] == 0.925
    assert data["rates"]["GBP"] == 0.79
    assert data["rates"]["JPY"] == 155.0
    assert data["rates"]["CAD"] == 1.36


def test_list_and_get_transactions(client):
    # Create a transaction
    payload = {
        "amount": 75.0,
        "currency": "USD",
        "customer_email": "list_test@example.com",
    }
    session_res = client.post("/api/v1/payments/checkout-session", json=payload)
    assert session_res.status_code == 200

    # List transactions
    res = client.get("/api/v1/payments/transactions?search=list_test@example.com")
    assert res.status_code == 200
    tx_list = res.json()
    assert len(tx_list) >= 1
    tx_id = tx_list[0]["id"]

    # Get transaction detail
    detail_res = client.get(f"/api/v1/payments/transactions/{tx_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == tx_id
    assert detail["customer_email"] == "list_test@example.com"
    assert detail["amount"] == 75.0
    assert detail["remaining_refundable_balance"] == 75.0
    assert detail["status"] == "COMPLETED"


def test_get_nonexistent_transaction(client):
    response = client.get("/api/v1/payments/transactions/tx_nonexistent_999")
    assert response.status_code == 404
