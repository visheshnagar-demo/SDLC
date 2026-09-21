import pytest


def test_list_and_create_cells(client):
    # List initial seeded cells
    res = client.get("/api/v1/cells")
    assert res.status_code == 200
    cells = res.json()
    assert len(cells) >= 3

    # Create new cell
    new_cell_payload = {
        "cell_number": "E-501",
        "block_name": "Block E",
        "capacity": 1,
        "security_tier": "HIGH_SECURITY",
    }
    create_res = client.post("/api/v1/cells", json=new_cell_payload, headers={"X-User-Role": "ADMIN"})
    assert create_res.status_code == 201
    assert create_res.json()["cell_number"] == "E-501"


def test_cell_assignment_security_tier_mismatch(client):
    # Create HIGH_SECURITY inmate
    inmate_payload = {
        "inmate_number": "INM-HIGH-SEC-01",
        "first_name": "Micah",
        "last_name": "Bell",
        "date_of_birth": "1970-08-08",
        "security_tier": "HIGH_SECURITY",
    }
    inmate_res = client.post("/api/v1/inmates", json=inmate_payload, headers={"X-User-Role": "ADMIN"})
    assert inmate_res.status_code == 201
    inmate_id = inmate_res.json()["id"]

    # Get MINIMUM security cell (Cell A-101)
    cells_res = client.get("/api/v1/cells?security_tier=MINIMUM")
    assert cells_res.status_code == 200
    min_cell = cells_res.json()[0]

    # Assign HIGH_SECURITY inmate to MINIMUM cell -> 422 Unprocessable Entity
    assign_payload = {"inmate_id": inmate_id, "cell_id": min_cell["id"]}
    assign_res = client.post("/api/v1/cells/assign", json=assign_payload, headers={"X-User-Role": "GUARD"})
    assert assign_res.status_code == 422
    assert "Security tier mismatch" in assign_res.json()["detail"]


def test_cell_assignment_capacity_limit(client):
    # Create cell with capacity 1
    cell_payload = {
        "cell_number": "SOLO-01",
        "block_name": "Solitary",
        "capacity": 1,
        "security_tier": "HIGH_SECURITY",
    }
    cell_res = client.post("/api/v1/cells", json=cell_payload, headers={"X-User-Role": "ADMIN"})
    assert cell_res.status_code == 201
    cell_id = cell_res.json()["id"]

    # Create 2 HIGH_SECURITY inmates
    inmate1 = client.post("/api/v1/inmates", json={
        "inmate_number": "INM-SOLO-1", "first_name": "Inmate", "last_name": "One",
        "date_of_birth": "1990-01-01", "security_tier": "HIGH_SECURITY"
    }, headers={"X-User-Role": "ADMIN"}).json()["id"]

    inmate2 = client.post("/api/v1/inmates", json={
        "inmate_number": "INM-SOLO-2", "first_name": "Inmate", "last_name": "Two",
        "date_of_birth": "1990-01-01", "security_tier": "HIGH_SECURITY"
    }, headers={"X-User-Role": "ADMIN"}).json()["id"]

    # Assign inmate 1 -> 200 OK
    res1 = client.post("/api/v1/cells/assign", json={"inmate_id": inmate1, "cell_id": cell_id}, headers={"X-User-Role": "GUARD"})
    assert res1.status_code == 200

    # Assign inmate 2 to full cell -> 400 Bad Request
    res2 = client.post("/api/v1/cells/assign", json={"inmate_id": inmate2, "cell_id": cell_id}, headers={"X-User-Role": "GUARD"})
    assert res2.status_code == 400
    assert "capacity limit" in res2.json()["detail"]
