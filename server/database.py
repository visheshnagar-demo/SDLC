import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
        if ":memory:" in DATABASE_URL
        or "/tmp/" in DATABASE_URL
        or "sqlite" in DATABASE_URL
        else None,
    )
else:
    engine = create_engine(DATABASE_URL)

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


def seed_data(db: Session):
    from server.models import User, SecurityPolicy
    from server.auth import get_password_hash

    # Seed Admin User
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        admin = User(
            id=str(uuid.uuid4()),
            employee_id="EMP-001",
            email="admin@example.com",
            full_name="Admin User",
            department="IT",
            role="admin",
            hashed_password=get_password_hash("adminpassword"),
            is_active=True,
        )
        db.add(admin)

    # Seed Regular Test User
    regular = db.query(User).filter(User.email == "test@example.com").first()
    if not regular:
        regular = User(
            id=str(uuid.uuid4()),
            employee_id="EMP-002",
            email="test@example.com",
            full_name="Test User",
            department="Engineering",
            role="employee",
            hashed_password=get_password_hash("testpassword"),
            is_active=True,
        )
        db.add(regular)

    # Seed default Security Policy
    policy = (
        db.query(SecurityPolicy)
        .filter(SecurityPolicy.name == "Default Corporate Policy")
        .first()
    )
    if not policy:
        policy = SecurityPolicy(
            id=str(uuid.uuid4()),
            name="Default Corporate Policy",
            description="Baseline security policy for corporate mobile devices",
            min_os_version_ios="16.0",
            min_os_version_android="12.0",
            require_encryption=True,
            require_passcode=True,
            is_active=True,
        )
        db.add(policy)

    try:
        db.commit()
    except Exception:
        db.rollback()
