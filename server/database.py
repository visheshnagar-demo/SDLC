import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mobile_mgmt.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import server.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session = None):
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        from server.models import User, SecurityPolicy, Device
        from server.auth import get_password_hash

        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                id=str(uuid.uuid4()),
                employee_id="EMP-000",
                email="admin@example.com",
                full_name="Admin User",
                department="IT",
                role="ADMIN",
                is_active=True,
                hashed_password=get_password_hash("adminpassword"),
            )
            db.add(admin_user)

        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                id=str(uuid.uuid4()),
                employee_id="EMP-001",
                email="test@example.com",
                full_name="Test User",
                department="Engineering",
                role="EMPLOYEE",
                is_active=True,
                hashed_password=get_password_hash("testpassword"),
            )
            db.add(test_user)

        policy = (
            db.query(SecurityPolicy)
            .filter(SecurityPolicy.name == "Global Corporate Policy")
            .first()
        )
        if not policy:
            policy = SecurityPolicy(
                id=str(uuid.uuid4()),
                name="Global Corporate Policy",
                description="Default baseline policy for corporate mobile devices",
                min_os_version_ios="16.0",
                min_os_version_android="13.0",
                require_encryption=True,
                require_passcode=True,
                is_active=True,
            )
            db.add(policy)

        device = (
            db.query(Device).filter(Device.serial_number == "SN-IPHONE15-001").first()
        )
        if not device:
            device = Device(
                id=str(uuid.uuid4()),
                serial_number="SN-IPHONE15-001",
                imei="352094123456789",
                model="iPhone 15 Pro",
                manufacturer="Apple",
                os_type="iOS",
                os_version="17.2",
                ownership_type="CORPORATE",
                status="AVAILABLE",
                is_encrypted=True,
                passcode_enforced=True,
                is_compliant=True,
            )
            db.add(device)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        if close_session:
            db.close()
