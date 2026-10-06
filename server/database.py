import os
import uuid
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hospital.db")

connect_args = {}
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    if ":memory:" in DATABASE_URL or DATABASE_URL == "sqlite://":
        engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def init_db():
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    from server import models

    try:
        # Seed Admin User
        admin_user = db.query(models.User).filter_by(email="admin@example.com").first()
        if not admin_user:
            admin_user = models.User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                hashed_password=_hash_password("adminpassword"),
                full_name="Hospital Administrator",
                role="Admin",
                is_active=True,
            )
            db.add(admin_user)

        # Seed Test Regular User / Patient
        test_user = db.query(models.User).filter_by(email="test@example.com").first()
        if not test_user:
            test_user = models.User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=_hash_password("testpassword"),
                full_name="Jane Doe",
                role="Patient",
                is_active=True,
            )
            db.add(test_user)

        # Seed Doctor User
        doc_user = db.query(models.User).filter_by(email="doctor@example.com").first()
        if not doc_user:
            doc_user = models.User(
                id=str(uuid.uuid4()),
                email="doctor@example.com",
                hashed_password=_hash_password("doctorpassword"),
                full_name="Dr. Sarah Jenkins",
                role="Doctor",
                is_active=True,
            )
            db.add(doc_user)

        db.commit()

        # Seed Doctors
        doc_jenkins = (
            db.query(models.Doctor).filter_by(name="Dr. Sarah Jenkins").first()
        )
        if not doc_jenkins:
            doc_jenkins = models.Doctor(
                id=str(uuid.uuid4()),
                user_id=doc_user.id if doc_user else None,
                name="Dr. Sarah Jenkins",
                specialty="Cardiology",
                department="Cardiology",
                consultation_fee=150.0,
                available_days="Mon,Tue,Wed,Thu,Fri",
                slot_duration_minutes=30,
            )
            db.add(doc_jenkins)

        doc_vance = db.query(models.Doctor).filter_by(name="Dr. Marcus Vance").first()
        if not doc_vance:
            doc_vance = models.Doctor(
                id=str(uuid.uuid4()),
                name="Dr. Marcus Vance",
                specialty="Neurology",
                department="Neurology",
                consultation_fee=200.0,
                available_days="Mon,Tue,Wed,Thu",
                slot_duration_minutes=30,
            )
            db.add(doc_vance)

        doc_kim = db.query(models.Doctor).filter_by(name="Dr. David Kim").first()
        if not doc_kim:
            doc_kim = models.Doctor(
                id=str(uuid.uuid4()),
                name="Dr. David Kim",
                specialty="Pediatrics",
                department="Pediatrics",
                consultation_fee=120.0,
                available_days="Tue,Wed,Thu,Fri,Sat",
                slot_duration_minutes=30,
            )
            db.add(doc_kim)

        db.commit()

        # Seed Sample Patient
        patient_jane = db.query(models.Patient).filter_by(mrn="MRN-99201").first()
        if not patient_jane:
            patient_jane = models.Patient(
                id=str(uuid.uuid4()),
                user_id=test_user.id if test_user else None,
                mrn="MRN-99201",
                first_name="Jane",
                last_name="Doe",
                date_of_birth="1988-04-15",
                gender="Female",
                phone="+1 (555) 0199",
                email="jane.doe@example.com",
                address="742 Evergreen Terrace",
                emergency_contact_name="John Doe",
                emergency_contact_phone="+1 (555) 0198",
                emergency_contact_relationship="Spouse",
                insurance_provider="BlueCross BlueShield",
                insurance_policy_number="BCS-992014",
                insurance_group_number="GRP-88210",
                insurance_status="Active",
                allergies="Penicillin (Severe)",
            )
            db.add(patient_jane)
            db.commit()

        # Seed an initial appointment if none exists
        existing_appt = (
            db.query(models.Appointment).filter_by(patient_id=patient_jane.id).first()
        )
        if not existing_appt and doc_jenkins and patient_jane:
            appt = models.Appointment(
                id=str(uuid.uuid4()),
                patient_id=patient_jane.id,
                doctor_id=doc_jenkins.id,
                appointment_date="2026-06-10",
                start_time="10:00",
                end_time="10:30",
                reason="Persistent hypertension and chest tightness following exercise.",
                appointment_type="Consultation / Routine Checkup",
                status="Scheduled",
                version=1,
            )
            db.add(appt)
            db.commit()

    except Exception:
        db.rollback()
