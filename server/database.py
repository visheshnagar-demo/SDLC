import os
import uuid
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/mobile_mgmt.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    from server.models import User, SecurityPolicy
    from server.auth import get_password_hash

    try:
        # Seed Admin
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                full_name="Admin User",
                employee_id="EMP001",
                department="IT Administration",
                role="admin",
                is_active=True,
            )
            db.add(admin)

        # Seed Test User
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                full_name="Test User",
                employee_id="EMP002",
                department="Engineering",
                role="user",
                is_active=True,
            )
            db.add(user)

        # Seed Default Policy
        policy = (
            db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).first()
        )
        if not policy:
            policy = SecurityPolicy(
                id=str(uuid.uuid4()),
                name="Default Corporate Security Policy",
                description="Global baseline compliance policy for corporate and BYOD mobile devices.",
                min_os_version_ios="15.0",
                min_os_version_android="11.0",
                require_encryption=True,
                require_passcode=True,
                is_active=True,
            )
            db.add(policy)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
