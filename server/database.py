import uuid
from datetime import date, time
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from server.config import settings
from server.models import (
    Base,
    User,
    Patient,
    Doctor,
    DoctorSchedule,
)

# SQLite engine configuration vs PostgreSQL
if "sqlite" in settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool if ":memory:" in settings.DATABASE_URL else None,
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
    )

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


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def init_db():
    """Idempotently initialize all database tables."""
    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    """Seed initial users, doctor, schedules, and patient idempotently."""
    try:
        # Seed Admin
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                hashed_password=hash_password("adminpassword"),
                full_name="Hospital Administrator",
                role="ADMIN",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        # Seed Test User (Staff / Receptionist)
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=hash_password("testpassword"),
                full_name="Test Staff",
                role="RECEPTIONIST",
                is_active=True,
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        # Seed Doctor User
        doctor_user = db.query(User).filter(User.email == "doctor@example.com").first()
        if not doctor_user:
            doctor_user = User(
                id=str(uuid.uuid4()),
                email="doctor@example.com",
                hashed_password=hash_password("doctorpassword"),
                full_name="Dr. Marcus Smith",
                role="DOCTOR",
                is_active=True,
            )
            db.add(doctor_user)
            db.commit()
            db.refresh(doctor_user)

        # Seed Doctor profile
        doctor_profile = (
            db.query(Doctor).filter(Doctor.user_id == doctor_user.id).first()
        )
        if not doctor_profile:
            doctor_profile = Doctor(
                id=str(uuid.uuid4()),
                user_id=doctor_user.id,
                doctor_code="DOC-201",
                department="Cardiology",
                qualification="MD, FACC",
                consultation_fee=150.00,
                slot_duration_minutes=30,
                is_available=True,
            )
            db.add(doctor_profile)
            db.commit()
            db.refresh(doctor_profile)

            # Seed Schedules for Doctor (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4)
            for day in [0, 1, 2, 3, 4]:
                sched = DoctorSchedule(
                    id=str(uuid.uuid4()),
                    doctor_id=doctor_profile.id,
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    is_active=True,
                )
                db.add(sched)
            db.commit()

        # Seed initial patient
        patient = db.query(Patient).filter(Patient.patient_code == "PAT-1001").first()
        if not patient:
            patient = Patient(
                id=str(uuid.uuid4()),
                patient_code="PAT-1001",
                first_name="John",
                last_name="Doe",
                date_of_birth=date(1985, 4, 12),
                gender="MALE",
                phone_number="+1-555-0100",
                email="john.doe@example.com",
                address="123 Health Ave, Springfield",
                emergency_contact_name="Jane Doe",
                emergency_contact_phone="+1-555-0101",
                insurance_provider="BlueCross",
                insurance_policy_number="BC-998822",
            )
            db.add(patient)
            db.commit()

    except Exception:
        db.rollback()
        raise
