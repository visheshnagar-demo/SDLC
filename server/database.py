import os
import uuid
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import IntegrityError

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_hash(password: str) -> str:
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
    import server.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    from server.models.audit import User
    from server.models.housing import HousingUnit

    # Seed regular test user
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="Intake Officer",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed admin user
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                role="Facility Admin",
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed initial housing units
    try:
        if db.query(HousingUnit).count() == 0:
            units = [
                HousingUnit(
                    unit_name="Unit A - Minimum Security",
                    security_level="minimum",
                    capacity=40,
                    current_occupancy=0,
                ),
                HousingUnit(
                    unit_name="Unit B - Medium Security",
                    security_level="medium",
                    capacity=50,
                    current_occupancy=0,
                ),
                HousingUnit(
                    unit_name="Unit C - Maximum Security",
                    security_level="maximum",
                    capacity=30,
                    current_occupancy=0,
                ),
                HousingUnit(
                    unit_name="Unit D - Medical Isolation",
                    security_level="maximum",
                    capacity=15,
                    current_occupancy=0,
                ),
            ]
            for u in units:
                db.add(u)
            db.commit()
    except IntegrityError:
        db.rollback()
