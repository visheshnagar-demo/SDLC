import json
import uuid
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from server.app.core.config import settings
from server.app.core.security import get_password_hash

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Import all models before create_all to register metadata
    import server.app.models.user  # noqa: F401
    import server.app.models.patient  # noqa: F401
    import server.app.models.doctor  # noqa: F401
    import server.app.models.appointment  # noqa: F401
    import server.app.models.medical_record  # noqa: F401
    import server.app.models.audit_log  # noqa: F401

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session) -> None:
    from server.app.models.user import User
    from server.app.models.patient import Patient
    from server.app.models.doctor import Doctor

    # Seed Admin User
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            username="admin",
            hashed_password=get_password_hash("adminpassword"),
            role="ADMIN",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Seed Doctor User (test@example.com)
    doctor_user = db.query(User).filter(User.email == "test@example.com").first()
    if not doctor_user:
        doctor_user = User(
            id=str(uuid.uuid4()),
            email="test@example.com",
            username="dr_smith",
            hashed_password=get_password_hash("testpassword"),
            role="DOCTOR",
            is_active=True,
        )
        db.add(doctor_user)
        db.commit()
        db.refresh(doctor_user)

    # Seed Doctor profile
    doctor_profile = db.query(Doctor).filter(Doctor.user_id == doctor_user.id).first()
    if not doctor_profile:
        doctor_profile = Doctor(
            id="11111111-1111-4111-a111-111111111111",
            user_id=doctor_user.id,
            first_name="John",
            last_name="Smith",
            specialty="Cardiology",
            department="Cardiology",
            license_number="LIC-CARD-001",
            availability_schedule=json.dumps(
                {
                    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "start_time": "09:00",
                    "end_time": "17:00",
                    "slot_duration_minutes": 30,
                }
            ),
        )
        db.add(doctor_profile)
        db.commit()

    # Seed Nurse User
    nurse_user = db.query(User).filter(User.email == "nurse@example.com").first()
    if not nurse_user:
        nurse_user = User(
            id=str(uuid.uuid4()),
            email="nurse@example.com",
            username="nurse_sarah",
            hashed_password=get_password_hash("testpassword"),
            role="NURSE",
            is_active=True,
        )
        db.add(nurse_user)
        db.commit()
        db.refresh(nurse_user)

    # Seed Patient User
    patient_user = db.query(User).filter(User.email == "patient@example.com").first()
    if not patient_user:
        patient_user = User(
            id=str(uuid.uuid4()),
            email="patient@example.com",
            username="patient_jane",
            hashed_password=get_password_hash("testpassword"),
            role="PATIENT",
            is_active=True,
        )
        db.add(patient_user)
        db.commit()
        db.refresh(patient_user)

    # Seed Patient profile
    patient_profile = (
        db.query(Patient).filter(Patient.national_id == "SSN-000-11-2222").first()
    )
    if not patient_profile:
        patient_profile = Patient(
            id="22222222-2222-4222-a222-222222222222",
            user_id=patient_user.id,
            first_name="Jane",
            last_name="Doe",
            date_of_birth="1990-05-15",
            gender="Female",
            national_id="SSN-000-11-2222",
            phone="+1-555-0199",
            address="123 Health Ave, Suite 100",
            emergency_contact=json.dumps(
                {
                    "name": "Richard Doe",
                    "relationship": "Spouse",
                    "phone": "+1-555-0198",
                }
            ),
            insurance_info=json.dumps(
                {
                    "provider": "Blue Cross",
                    "policy_number": "BCBS-998877",
                    "group_number": "GRP-1002",
                }
            ),
        )
        db.add(patient_profile)
        db.commit()
