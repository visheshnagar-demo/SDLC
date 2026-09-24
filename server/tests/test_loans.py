from datetime import date, timedelta


def test_list_loans(client):
    response = client.get("/api/v1/loans")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["partner_museum_name"] == "Metropolitan Art Institute"


def test_create_loan_success(client):
    # ART-2026-001 (Roman Terracotta Amphora) is On Display, has no active loan
    art_id = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    payload = {
        "artifact_id": art_id,
        "partner_museum_name": "British Museum",
        "contact_person": "Lord Elgin",
        "contact_email": "curator@britishmuseum.org",
        "loan_start_date": "2026-10-01",
        "loan_end_date": "2027-04-01",
        "indemnity_valuation": 320000.00,
        "transit_requirements": "Custom high-density foam crate with humidity buffer."
    }
    resp = client.post("/api/v1/loans", json=payload)
    assert resp.status_code == 201
    loan = resp.json()
    assert loan["partner_museum_name"] == "British Museum"
    assert loan["loan_status"] == "Requested"


def test_create_loan_conflict_when_on_loan(client):
    # ART-2026-085 (Bronze Statue of Hermes) is already 'On Loan' and has active loan
    art_id = "d4e5f6a7-b8c9-0123-4567-89abcdef0123"
    payload = {
        "artifact_id": art_id,
        "partner_museum_name": "Louvre Museum",
        "contact_person": "Jean-Luc",
        "contact_email": "curator@louvre.fr",
        "loan_start_date": "2026-11-01",
        "loan_end_date": "2027-05-01",
        "indemnity_valuation": 750000.00
    }
    resp = client.post("/api/v1/loans", json=payload)
    assert resp.status_code == 409
    assert "cannot be assigned" in resp.json()["detail"] or "already has an active loan" in resp.json()["detail"]


def test_transition_loan_status(client):
    # Create loan first
    art_id = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    create_payload = {
        "artifact_id": art_id,
        "partner_museum_name": "Prado Museum",
        "contact_person": "Maria Sanchez",
        "contact_email": "msanchez@pradomuseum.es",
        "loan_start_date": "2026-10-15",
        "loan_end_date": "2027-02-15",
        "indemnity_valuation": 400000.00
    }
    loan_resp = client.post("/api/v1/loans", json=create_payload)
    loan_id = loan_resp.json()["id"]

    # Transition to In Transit
    transition_payload = {
        "loan_status": "In Transit",
        "transit_notes": "Departed museum loading dock under armed escort."
    }
    trans_resp = client.put(f"/api/v1/loans/{loan_id}/status", json=transition_payload)
    assert trans_resp.status_code == 200
    assert trans_resp.json()["loan_status"] == "In Transit"

    # Check artifact status became On Loan
    art_resp = client.get(f"/api/v1/artifacts/{art_id}")
    assert art_resp.json()["status"] == "On Loan"

    # Transition to Returned
    return_payload = {
        "loan_status": "Returned",
        "return_inspection_notes": "Artifact returned safely. Condition confirmed stable."
    }
    ret_resp = client.put(f"/api/v1/loans/{loan_id}/status", json=return_payload)
    assert ret_resp.status_code == 200
    assert ret_resp.json()["loan_status"] == "Returned"

    # Check artifact status became In Storage
    art_resp_after = client.get(f"/api/v1/artifacts/{art_id}")
    assert art_resp_after.json()["status"] == "In Storage"
