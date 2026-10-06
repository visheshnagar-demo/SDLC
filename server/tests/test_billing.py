def test_list_invoices(client):
    response = client.get("/api/v1/billing/invoices")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_and_pay_invoice(client, admin_headers, patient_headers):
    patients = client.get("/api/v1/patients").json()
    patient_id = patients[0]["id"]

    # 1. Create Invoice
    invoice_payload = {
        "patient_id": patient_id,
        "total_amount": 250.0,
        "copay_amount": 50.0,
        "due_date": "2026-07-31",
        "items": [
            {
                "description": "Specialist Consultation Fee",
                "cpt_code": "99204",
                "amount": 150.0,
            },
            {
                "description": "Electrocardiogram (ECG)",
                "cpt_code": "93000",
                "amount": 100.0,
            },
        ],
    }
    create_res = client.post(
        "/api/v1/billing/invoices", json=invoice_payload, headers=admin_headers
    )
    assert create_res.status_code == 201
    inv_data = create_res.json()
    inv_id = inv_data["id"]
    assert inv_data["total_amount"] == 250.0
    assert inv_data["copay_amount"] == 50.0
    assert inv_data["patient_balance"] == 200.0
    assert inv_data["status"] == "Unpaid"
    assert len(inv_data["items"]) == 2

    # 2. Get Invoice by ID
    get_res = client.get(f"/api/v1/billing/invoices/{inv_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == inv_id

    # 3. Pay partial amount ($100)
    pay1_res = client.post(
        f"/api/v1/billing/invoices/{inv_id}/pay",
        json={
            "amount_paid": 100.0,
            "payment_method": "Credit Card",
            "cardholder_name": "Jane Doe",
        },
        headers=patient_headers,
    )
    assert pay1_res.status_code == 200
    assert pay1_res.json()["payment_status"] == "Success"

    # Verify balance updated
    inv_after_pay1 = client.get(f"/api/v1/billing/invoices/{inv_id}").json()
    assert inv_after_pay1["patient_balance"] == 100.0
    assert inv_after_pay1["status"] == "Unpaid"

    # 4. Pay remaining amount ($100)
    pay2_res = client.post(
        f"/api/v1/billing/invoices/{inv_id}/pay",
        json={
            "amount_paid": 100.0,
            "payment_method": "Credit Card",
            "cardholder_name": "Jane Doe",
        },
        headers=patient_headers,
    )
    assert pay2_res.status_code == 200

    # Verify invoice is now Paid
    inv_after_pay2 = client.get(f"/api/v1/billing/invoices/{inv_id}").json()
    assert inv_after_pay2["patient_balance"] == 0.0
    assert inv_after_pay2["status"] == "Paid"


def test_payment_invalid_amount(client, patient_headers):
    patients = client.get("/api/v1/patients").json()
    patient_id = patients[0]["id"]
    inv_res = client.post(
        "/api/v1/billing/invoices",
        json={"patient_id": patient_id, "total_amount": 100.0, "copay_amount": 0.0},
    )
    inv_id = inv_res.json()["id"]

    # Payment of 0 or negative
    pay_res = client.post(
        f"/api/v1/billing/invoices/{inv_id}/pay",
        json={"amount_paid": 0.0},
        headers=patient_headers,
    )
    assert pay_res.status_code == 422


def test_payment_gateway_declined(client, patient_headers):
    patients = client.get("/api/v1/patients").json()
    patient_id = patients[0]["id"]
    inv_res = client.post(
        "/api/v1/billing/invoices",
        json={"patient_id": patient_id, "total_amount": 100.0, "copay_amount": 0.0},
    )
    inv_id = inv_res.json()["id"]

    # Payment with declined card pattern (0000)
    pay_res = client.post(
        f"/api/v1/billing/invoices/{inv_id}/pay",
        json={"amount_paid": 100.0, "card_number": "4111000000001111"},
        headers=patient_headers,
    )
    assert pay_res.status_code == 402
    assert "declined" in pay_res.json()["detail"].lower()
