def test_fish_health_records_lifecycle(client):
    tank_res = client.post(
        "/api/v1/tanks",
        json={
            "name": "Quarantine & Medical Tank",
            "location": "Veterinary Lab",
            "capacity_liters": 300.0,
            "water_type": "Freshwater",
        },
    )
    tank_id = tank_res.json()["id"]

    # 1. Create health record
    record_payload = {
        "tank_id": tank_id,
        "species": "Pterophyllum scalare (Angelfish)",
        "population_count": 8,
        "health_status": "Symptomatic",
        "symptoms": "Mild fin rot on dorsal fin.",
        "treatment_notes": "Antibacterial bath treatment administered.",
        "is_quarantined": True,
        "recorded_by": "Dr. Rostova",
    }
    res = client.post("/api/v1/health-records", json=record_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["species"] == record_payload["species"]
    assert data["is_quarantined"] is True
    record_id = data["id"]

    # 2. Get record by id
    res_get = client.get(f"/api/v1/health-records/{record_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == record_id

    # 3. List records with quarantine filter
    res_list = client.get(f"/api/v1/health-records?tank_id={tank_id}&is_quarantined=true")
    assert res_list.status_code == 200
    records = res_list.json()
    assert len(records) >= 1
    assert all(r["is_quarantined"] is True for r in records)

    # 4. Delete record
    res_del = client.delete(f"/api/v1/health-records/{record_id}")
    assert res_del.status_code == 204
