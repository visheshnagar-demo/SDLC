import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import IntegrityError

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models so Base metadata is populated
    import server.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def seed_data(db):
    from server.models import User, SecurityPolicy, Device, AuditLog
    from server.auth import get_password_hash
    from server.services.audit_service import create_audit_log

    # 1. Seed Admin User
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        try:
            admin = User(
                id=str(uuid.uuid4()),
                employee_id="EMP-ADMIN",
                email="admin@example.com",
                full_name="System Administrator",
                department="IT Operations",
                role="ADMIN",
                hashed_password=get_password_hash("adminpassword"),
                is_active=True,
            )
            db.add(admin)
            db.commit()
        except IntegrityError:
            db.rollback()

    # 2. Seed Employee User
    emp = db.query(User).filter(User.email == "test@example.com").first()
    if not emp:
        try:
            emp = User(
                id=str(uuid.uuid4()),
                employee_id="EMP-001",
                email="test@example.com",
                full_name="Test User",
                department="Engineering",
                role="EMPLOYEE",
                hashed_password=get_password_hash("testpassword"),
                is_active=True,
            )
            db.add(emp)
            db.commit()
        except IntegrityError:
            db.rollback()

    # 3. Seed Support User
    support = db.query(User).filter(User.email == "support@example.com").first()
    if not support:
        try:
            support = User(
                id=str(uuid.uuid4()),
                employee_id="EMP-SUPP",
                email="support@example.com",
                full_name="IT Support Specialist",
                department="IT Support",
                role="IT_SUPPORT",
                hashed_password=get_password_hash("supportpassword"),
                is_active=True,
            )
            db.add(support)
            db.commit()
        except IntegrityError:
            db.rollback()

    # 4. Seed Default Security Policy
    policy = db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).first()
    if not policy:
        try:
            policy = SecurityPolicy(
                id=str(uuid.uuid4()),
                name="Global Enterprise Security Policy",
                description="Default baseline compliance policy for corporate mobile devices.",
                min_os_version_ios="16.0",
                min_os_version_android="13.0",
                require_encryption=True,
                require_passcode=True,
                is_active=True,
            )
            db.add(policy)
            db.commit()
        except IntegrityError:
            db.rollback()

    # 5. Seed Initial Devices
    device_count = db.query(Device).count()
    if device_count == 0:
        sample_devices = [
            Device(
                id=str(uuid.uuid4()),
                serial_number="SN-IPH14-001",
                imei="358901234567890",
                model="iPhone 14 Pro",
                manufacturer="Apple",
                os_type="iOS",
                os_version="17.2",
                ownership_type="CORPORATE",
                status="AVAILABLE",
                is_encrypted=True,
                passcode_enforced=True,
                is_compliant=True,
            ),
            Device(
                id=str(uuid.uuid4()),
                serial_number="SN-S23-002",
                imei="864209876543210",
                model="Galaxy S23",
                manufacturer="Samsung",
                os_type="Android",
                os_version="14.0",
                ownership_type="CORPORATE",
                status="AVAILABLE",
                is_encrypted=True,
                passcode_enforced=True,
                is_compliant=True,
            ),
            Device(
                id=str(uuid.uuid4()),
                serial_number="SN-PIX8-003",
                imei="990011223344556",
                model="Pixel 8",
                manufacturer="Google",
                os_type="Android",
                os_version="14.0",
                ownership_type="BYOD",
                status="AVAILABLE",
                is_encrypted=True,
                passcode_enforced=True,
                is_compliant=True,
            ),
        ]
        for dev in sample_devices:
            try:
                db.add(dev)
                db.commit()
            except IntegrityError:
                db.rollback()

    # 6. Seed System Audit Log
    audit_count = db.query(AuditLog).count()
    if audit_count == 0:
        try:
            create_audit_log(
                db=db,
                actor_id=admin.id if admin else None,
                action="SYSTEM_INITIALIZED",
                resource_type="SYSTEM",
                resource_id="SYSTEM",
                details={"status": "INITIALIZED"},
            )
        except Exception:
            db.rollback()
