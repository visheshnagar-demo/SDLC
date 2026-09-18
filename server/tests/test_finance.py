def test_finance_and_shifts(client):
    # Open cashier shift
    shift_res = client.post(
        "/api/v1/finance/shifts/open",
        json={"counter_number": "Counter-1", "opening_cash": 1000.0},
    )
    assert shift_res.status_code == 201 or shift_res.status_code == 200
    shift_data = shift_res.json()
    shift_id = shift_data["id"]

    # Close cashier shift
    close_res = client.post(
        f"/api/v1/finance/shifts/{shift_id}/close", json={"closing_cash_actual": 1000.0}
    )
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "closed"

    # Daily report check
    rpt_res = client.get("/api/v1/finance/reports/daily")
    assert rpt_res.status_code == 200
    assert "total_revenue" in rpt_res.json()
