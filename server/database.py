"""Database setup and session management."""
import os
import uuid
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from server.config import settings

logger = logging.getLogger(__name__)

DATABASE_URL = settings.DATABASE_URL
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for obtaining database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(target_engine=None):
    """Initialize database tables idempotently."""
    eng = target_engine or engine
    # Import models here to ensure metadata is populated
    from server import models  # noqa: F401
    Base.metadata.create_all(bind=eng)


def seed_data(db: Session):
    """Seed initial data idempotently."""
    from server.models import User, Event, PassTier
    from server.security import hash_password

    try:
        # Seed Regular User
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                password_hash=hash_password("testpassword"),
                full_name="Test Attendee",
                phone="+14155550100",
                role="ATTENDEE",
                is_active=True,
                is_verified=True,
            )
            db.add(test_user)

        # Seed Admin User
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                password_hash=hash_password("adminpassword"),
                full_name="Event Administrator",
                phone="+14155550101",
                role="EVENT_ADMIN",
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)

        # Seed Security User
        security_user = db.query(User).filter(User.email == "security@example.com").first()
        if not security_user:
            security_user = User(
                id=str(uuid.uuid4()),
                email="security@example.com",
                password_hash=hash_password("securitypassword"),
                full_name="Gate Security Officer",
                phone="+14155550102",
                role="GATE_SECURITY",
                is_active=True,
                is_verified=True,
            )
            db.add(security_user)

        # Seed Default Event
        event = db.query(Event).filter(Event.title == "GarbaFest 2026 - Navratri Dandiya Nights").first()
        if not event:
            event_id = "event-garbafest-2026"
            event = Event(
                id=event_id,
                title="GarbaFest 2026 - Navratri Dandiya Nights",
                description="Annual 9-night Garba and Dandiya celebration with live orchestra and food stalls.",
                venue_name="Grand Garba Arena, Ahmedabad",
                start_date="2026-10-15",
                end_date="2026-10-24",
                status="ACTIVE",
            )
            db.add(event)
            db.flush()

            # Seed Pass Tiers for Event
            tiers_data = [
                {
                    "id": "tier-single-day-2026",
                    "tier_name": "Single-Day Pass",
                    "description": "Access for any single night of GarbaFest 2026.",
                    "price": 25.00,
                    "total_quota": 1000,
                    "available_quota": 1000,
                    "valid_from": "2026-10-15",
                    "valid_to": "2026-10-24",
                },
                {
                    "id": "tier-season-pass-2026",
                    "tier_name": "Season Pass",
                    "description": "Full access pass for all 9 nights of celebrations.",
                    "price": 150.00,
                    "total_quota": 500,
                    "available_quota": 500,
                    "valid_from": "2026-10-15",
                    "valid_to": "2026-10-24",
                },
                {
                    "id": "tier-vip-pass-2026",
                    "tier_name": "VIP Pass",
                    "description": "VIP arena lounge access, reserved parking, and fast-track gate entry.",
                    "price": 300.00,
                    "total_quota": 200,
                    "available_quota": 200,
                    "valid_from": "2026-10-15",
                    "valid_to": "2026-10-24",
                },
            ]
            for td in tiers_data:
                tier = PassTier(
                    id=td["id"],
                    event_id=event.id,
                    tier_name=td["tier_name"],
                    description=td["description"],
                    price=td["price"],
                    total_quota=td["total_quota"],
                    available_quota=td["available_quota"],
                    valid_from=td["valid_from"],
                    valid_to=td["valid_to"],
                )
                db.add(tier)

        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning(f"Error seeding data: {e}")
