from datetime import date, timedelta


def test_list_inspections(client):
    response = client.get("/api/v1/inspections")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


def test_schedule_and_complete_inspection_high_risk(client):
    art_id = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    sched_payload = {
        "artifact_id": art_id,
        "assigned_inspector": "Inspector Jacques Clouseau",
        "scheduled_date": date.today().isoformat(),
        "findings_notes": "Routine scheduled check."
    }
    sched_resp = client.post("/api/v1/inspections", json=sched_payload)
    assert sched_resp.status_code == 201
    insp_id = sched_resp.json()["id"]

    # Complete with severe condition (high risk)
    complete_payload = {
        "surface_condition": "Severe Flaking",
        "pest_activity": True,
        "structural_integrity": "Compromised",
        "findings_notes": "Urgent attention required: active woodworm detected."
    }
    comp_resp = client.put(f"/api/v1/inspections/{insp_id}/complete", json=complete_payload)
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert comp_data["inspection_status"] == "Completed"
    assert comp_data["pest_activity"] is True
    # Next recommended inspection date should be 30 days out for high risk
    expected_next = date.today() + timedelta(days=30)
    assert comp_data["next_recommended_inspection_date"] == expected_next.isoformat()


def test_complete_inspection_normal_risk(client):
    art_id = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    sched_payload = {
        "artifact_id": art_id,
        "assigned_inspector": "Dr. Eleanor Vance",
        "scheduled_date": date.today().isoformat()
    }
    sched_resp = client.post("/api/v1/inspections", json=sched_payload)
    insp_id = sched_resp.json()["id"]

    complete_payload = {
        "surface_condition": "Normal",
        "pest_activity": False,
        "structural_integrity": "Sound",
        "findings_notes": "Pristine state maintained in climate case."
    }
    comp_resp = client.put(f"/api/v1/inspections/{insp_id}/complete", json=complete_payload)
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    expected_next = date.today() + timedelta(days=180)
    assert comp_data["next_recommended_inspection_date"] == expected_next.isoformat()
