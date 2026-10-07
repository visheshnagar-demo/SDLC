from datetime import date
from server.models import User, Patient


def test_create_and_get_patient_profile(client, admin_token):
    # Register a new user first
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "sarah.patient@example.com",
            "password": "Password123!",
            "full_name": "Sarah Connor",
            "role": "PATIENT",
        },
    )
    assert reg_resp.status_code == 201
    user_id = reg_resp.json()["id"]

    # Create patient profile
    patient_payload = {
        "user_id": user_id,
        "national_id": "SSN-999-88-7777",
        "date_of_birth": "1985-03-22",
        "gender": "Female",
        "blood_group": "O+",
        "address": "742 Evergreen Terrace",
        "emergency_contact_name": "John Connor",
        "emergency_contact_phone": "+1-555-9111",
        "insurance_provider": "Aetna Health",
        "insurance_policy_number": "AETNA-12345",
    }
    create_resp = client.post(
        "/api/v1/patients",
        json=patient_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_resp.status_code == 201
    patient_data = create_resp.json()
    assert patient_data["national_id"] == "SSN-999-88-7777"
    assert patient_data["emergency_contact_name"] == "John Connor"
    patient_id = patient_data["id"]

    # Duplicate National ID should fail with 400
    dup_resp = client.post(
        "/api/v1/patients",
        json={
            "user_id": user_id,
            "national_id": "SSN-999-88-7777",
            "date_of_birth": "1985-03-22",
            "gender": "Female",
            "emergency_contact_name": "John",
            "emergency_contact_phone": "+1-555-9111",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert dup_resp.status_code == 400

    # Get patient profile by ID
    get_resp = client.get(
        f"/api/v1/patients/{patient_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["insurance_provider"] == "Aetna Health"


def test_list_patients_staff_access(client, doctor_token, patient_token):
    # Doctor can list patients
    list_resp = client.get(
        "/api/v1/patients?skip=0&limit=10",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1

    # Search filter
    search_resp = client.get(
        "/api/v1/patients?search=Jane",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert search_resp.status_code == 200
    assert len(search_resp.json()["items"]) >= 1

    # Patient role is forbidden from listing all patients
    forbidden_resp = client.get(
        "/api/v1/patients",
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert forbidden_resp.status_code == 403


def test_patient_rbac_isolation(client, patient_token, admin_token, db):
    # Create another patient
    user2 = User(
        id="other-patient-user-id",
        email="other@example.com",
        hashed_password="hash",
        full_name="Other Person",
        role="PATIENT",
        is_active=True,
    )
    patient2 = Patient(
        id="other-patient-id",
        user_id="other-patient-user-id",
        national_id="SSN-OTHER-001",
        date_of_birth=date(1992, 1, 1),
        gender="Male",
        emergency_contact_name="Contact",
        emergency_contact_phone="123",
    )
    db.add(user2)
    db.add(patient2)
    db.commit()

    # Patient token (for test@example.com) trying to view other-patient-id should get 403
    resp = client.get(
        "/api/v1/patients/other-patient-id",
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert resp.status_code == 403

    # Admin should be able to view
    resp_admin = client.get(
        "/api/v1/patients/other-patient-id",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp_admin.status_code == 200
