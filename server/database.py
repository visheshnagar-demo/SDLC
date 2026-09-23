"""Database connection and session management."""

import os
import uuid
from datetime import date, datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./study_planner.db")

# For SQLite, enable check_same_thread=False
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for providing a database session to API routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables in the database idempotently."""
    # Import all models so metadata is populated
    import server.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    """Seed sample data if tables are empty for immediate out-of-the-box readiness."""
    from server.models.subject import Subject
    from server.models.availability import AvailabilityProfile

    # Seed default subjects if none exist
    existing_subjects = db.query(Subject).first()
    if not existing_subjects:
        now = datetime.now(timezone.utc)
        sample_subjects = [
            Subject(
                id=str(uuid.uuid4()),
                name="Organic Chemistry",
                difficulty_level=4,
                target_date=date.today() + timedelta(days=45),
                estimated_total_hours=45.0,
                color_tag="#3B82F6",
                created_at=now,
                updated_at=now,
            ),
            Subject(
                id=str(uuid.uuid4()),
                name="Advanced Calculus",
                difficulty_level=5,
                target_date=date.today() + timedelta(days=20),
                estimated_total_hours=35.0,
                color_tag="#7C3AED",
                created_at=now,
                updated_at=now,
            ),
            Subject(
                id=str(uuid.uuid4()),
                name="World History",
                difficulty_level=2,
                target_date=date.today() + timedelta(days=60),
                estimated_total_hours=20.0,
                color_tag="#10B981",
                created_at=now,
                updated_at=now,
            ),
        ]
        db.add_all(sample_subjects)
        db.commit()

    # Seed default weekly availability if none exist
    existing_avail = db.query(AvailabilityProfile).first()
    if not existing_avail:
        now = datetime.now(timezone.utc)
        default_schedule = [
            ("MONDAY", 180, "EVENING"),
            ("TUESDAY", 120, "EVENING"),
            ("WEDNESDAY", 180, "EVENING"),
            ("THURSDAY", 120, "EVENING"),
            ("FRIDAY", 150, "AFTERNOON"),
            ("SATURDAY", 360, "MORNING"),
            ("SUNDAY", 240, "MORNING"),
        ]
        avail_entities = [
            AvailabilityProfile(
                id=str(uuid.uuid4()),
                day_of_week=day,
                available_minutes=mins,
                preferred_time_of_day=pref,
                created_at=now,
                updated_at=now,
            )
            for day, mins, pref in default_schedule
        ]
        db.add_all(avail_entities)
        db.commit()
