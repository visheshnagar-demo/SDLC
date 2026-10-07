import uuid
import bcrypt
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.config import settings
from server.models import Base, User, Patient, Doctor

# Database engine configuration
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool if ":memory:" in settings.DATABASE_URL else None,
    )
else:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def seed_data(db):
    """Seed initial demo and role accounts idempotently."""
    try:
        # 1. Admin user
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                hashed_password=hash_password("adminpassword"),
                full_name="System Administrator",
                phone_number="+1-555-0100",
                role="ADMIN",
                is_active=True,
            )
            db.add(admin)
            db.flush()

        # 2. Doctor user & profile
        doctor_user = db.query(User).filter(User.email == "doctor@example.com").first()
        if not doctor_user:
            doctor_user = User(
                id=str(uuid.uuid4()),
                email="doctor@example.com",
                hashed_password=hash_password("doctorpassword"),
                full_name="Dr. Sarah Smith, MD",
                phone_number="+1-555-0101",
                role="DOCTOR",
                is_active=True,
            )
            db.add(doctor_user)
            db.flush()

        doc_profile = db.query(Doctor).filter(Doctor.user_id == doctor_user.id).first()
        if not doc_profile:
            doc_profile = Doctor(
                id=str(uuid.uuid4()),
                user_id=doctor_user.id,
                department="Cardiology",
                specialization="Cardiologist",
                consultation_fee=150.0,
                slot_duration_minutes=30,
                is_available=True,
            )
            db.add(doc_profile)
            db.flush()

        # Additional Doctor in Neurology
        doctor2_user = (
            db.query(User).filter(User.email == "doctor.neuro@example.com").first()
        )
        if not doctor2_user:
            doctor2_user = User(
                id=str(uuid.uuid4()),
                email="doctor.neuro@example.com",
                hashed_password=hash_password("doctorpassword"),
                full_name="Dr. Marcus Vance, MD",
                phone_number="+1-555-0105",
                role="DOCTOR",
                is_active=True,
            )
            db.add(doctor2_user)
            db.flush()

        doc2_profile = (
            db.query(Doctor).filter(Doctor.user_id == doctor2_user.id).first()
        )
        if not doc2_profile:
            doc2_profile = Doctor(
                id=str(uuid.uuid4()),
                user_id=doctor2_user.id,
                department="Neurology",
                specialization="Neurologist",
                consultation_fee=180.0,
                slot_duration_minutes=30,
                is_available=True,
            )
            db.add(doc2_profile)
            db.flush()

        # 3. Nurse user
        nurse_user = db.query(User).filter(User.email == "nurse@example.com").first()
        if not nurse_user:
            nurse_user = User(
                id=str(uuid.uuid4()),
                email="nurse@example.com",
                hashed_password=hash_password("nursepassword"),
                full_name="Nurse John Doe, RN",
                phone_number="+1-555-0102",
                role="NURSE",
                is_active=True,
            )
            db.add(nurse_user)
            db.flush()

        # 4. Receptionist user
        receptionist_user = (
            db.query(User).filter(User.email == "receptionist@example.com").first()
        )
        if not receptionist_user:
            receptionist_user = User(
                id=str(uuid.uuid4()),
                email="receptionist@example.com",
                hashed_password=hash_password("receptionistpassword"),
                full_name="Mary Jenkins",
                phone_number="+1-555-0103",
                role="RECEPTIONIST",
                is_active=True,
            )
            db.add(receptionist_user)
            db.flush()

        # 5. Patient user & profile (test@example.com / testpassword)
        patient_user = db.query(User).filter(User.email == "test@example.com").first()
        if not patient_user:
            patient_user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=hash_password("testpassword"),
                full_name="Jane Doe",
                phone_number="+1-555-0199",
                role="PATIENT",
                is_active=True,
            )
            db.add(patient_user)
            db.flush()

        patient_profile = (
            db.query(Patient).filter(Patient.user_id == patient_user.id).first()
        )
        if not patient_profile:
            patient_profile = Patient(
                id=str(uuid.uuid4()),
                user_id=patient_user.id,
                national_id="SSN-123-45-6789",
                date_of_birth=date(1990, 5, 15),
                gender="Female",
                blood_group="A+",
                address="123 Health Ave, Metropolis, NY",
                emergency_contact_name="John Doe",
                emergency_contact_phone="+1-555-0100",
                insurance_provider="BlueCross BlueShield",
                insurance_policy_number="POL-987654",
            )
            db.add(patient_profile)
            db.flush()

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Warning: Seed data initialization encountered an issue: {e}")


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
