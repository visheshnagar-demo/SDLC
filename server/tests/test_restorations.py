def test_list_restorations(client):
    response = client.get("/api/v1/restorations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["conservator_name"] == "Dr. Eleanor Vance"


def test_create_restoration_updates_artifact_condition(client):
    art_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # Flemish Silk Tapestry Fragment (Fair)
    
    # Check initial condition
    initial_art = client.get(f"/api/v1/artifacts/{art_id}").json()
    assert initial_art["condition_rating"] == "Fair"

    payload = {
        "artifact_id": art_id,
        "conservator_name": "Dr. Marcus Brody",
        "treatment_date": "2026-09-25",
        "technique": "Hygroscopic Fiber Relaxation & Ultrasonic Cleaning",
        "materials_used": "Deionized vapor chamber, silk support mesh",
        "assessment_notes": "Tapestry fiber tension normalized; mold spores eradicated.",
        "condition_before": "Fair",
        "condition_after": "Stable"
    }

    create_resp = client.post("/api/v1/restorations", json=payload)
    assert create_resp.status_code == 201
    rest_data = create_resp.json()
    assert rest_data["condition_after"] == "Stable"

    # Verify artifact condition was updated synchronously
    updated_art = client.get(f"/api/v1/artifacts/{art_id}").json()
    assert updated_art["condition_rating"] == "Stable"


def test_create_restoration_nonexistent_artifact_404(client):
    payload = {
        "artifact_id": "00000000-0000-0000-0000-000000000000",
        "conservator_name": "Dr. Eleanor Vance",
        "treatment_date": "2026-09-25",
        "technique": "Stabilization",
        "materials_used": "Wax",
        "assessment_notes": "None",
        "condition_before": "Critical",
        "condition_after": "Fair"
    }
    resp = client.post("/api/v1/restorations", json=payload)
    assert resp.status_code == 404
