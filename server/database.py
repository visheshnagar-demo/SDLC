import os
import uuid
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from server.config import settings

DATABASE_URL = settings.DATABASE_URL

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db(target_engine=None):
    from server.models import User, Patient, Doctor, DoctorSchedule, Appointment, ClinicalRecord, AuditLog  # noqa: F401
    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)

def seed_data(db: Session):
    import bcrypt
    from server.models.user import User
    from server.models.doctor import Doctor, DoctorSchedule
    from server.models.patient import Patient

    def get_password_hash(pwd: str) -> str:
        return bcrypt.hashpw(pwd[:72].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # 1. Admin user
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            hashed_password=get_password_hash("adminpassword"),
            full_name="Hospital Administrator",
            role="ADMIN",
            is_active=True,
        )
        db.add(admin_user)

    # 2. Regular user / Receptionist
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        test_user = User(
            id=str(uuid.uuid4()),
            email="test@example.com",
            hashed_password=get_password_hash("testpassword"),
            full_name="Test Receptionist",
            role="RECEPTIONIST",
            is_active=True,
        )
        db.add(test_user)

    # 3. Doctor user
    doc_user = db.query(User).filter(User.email == "doctor@example.com").first()
    if not doc_user:
        doc_user = User(
            id=str(uuid.uuid4()),
            email="doctor@example.com",
            hashed_password=get_password_hash("doctorpassword"),
            full_name="Dr. Marcus Smith",
            role="DOCTOR",
            is_active=True,
        )
        db.add(doc_user)
        db.flush()

    # Doctor Profile
    doctor = db.query(Doctor).filter(Doctor.user_id == doc_user.id).first()
    if not doctor:
        doctor = Doctor(
            id=str(uuid.uuid4()),
            user_id=doc_user.id,
            doctor_code="DOC-201",
            department="Cardiology",
            qualification="MD, FACC",
            consultation_fee=150.00,
            slot_duration_minutes=30,
            is_available=True,
        )
        db.add(doctor)
        db.flush()

        # Doctor Schedules (Mon-Fri 09:00 - 17:00)
        for day in range(5):
            sched = DoctorSchedule(
                id=str(uuid.uuid4()),
                doctor_id=doctor.id,
                day_of_week=day,
                start_time="09:00:00",
                end_time="17:00:00",
                is_active=True,
            )
            db.add(sched)

    # 4. Seed sample patient
    sample_patient = db.query(Patient).filter(Patient.patient_code == "PAT-1001").first()
    if not sample_patient:
        sample_patient = Patient(
            id=str(uuid.uuid4()),
            patient_code="PAT-1001",
            first_name="John",
            last_name="Doe",
            date_of_birth="1985-04-12",
            gender="MALE",
            phone_number="555-0199",
            email="john.doe@example.com",
            address="123 Health Ave, Metropolis",
            emergency_contact_name="Jane Doe",
            emergency_contact_phone="555-0198",
            insurance_provider="BlueCross",
            insurance_policy_number="BC-987654",
        )
        db.add(sample_patient)

    try:
        db.commit()
    except Exception:
        db.rollback()
