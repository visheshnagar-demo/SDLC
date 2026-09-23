import os
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

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


def seed_data(db):
    from server.models import Email

    # Check if data already exists
    if db.query(Email).first() is not None:
        return

    sample_emails = [
        Email(
            id=str(uuid.uuid4()),
            subject="URGENT: Production Server SSL Certificate Expiring in 24h",
            body="[ALERT] Critical SSL Expiration Warning for *.cloudcorp.io. Please find the mandatory remediation runbook link and update immediately.",
            preview="[ALERT] Critical SSL Expiration Warning for *.cloudcorp.io. Please find the mandatory remediation runbook link...",
            file_name="alert.eml",
            file_type=".eml",
            category="Urgent",
            original_category="Urgent",
            confidence_score=0.92,
            status="PROCESSED",
            is_overridden=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        ),
        Email(
            id=str(uuid.uuid4()),
            subject="Sprint Planning & Architecture Review - Q4 Goals",
            body="Hi team, please review the attached architecture proposal for the upcoming sprint deliverables and quarterly budget.",
            preview="Hi team, please review the attached architecture proposal for the upcoming sprint deliverables...",
            file_name="meeting_notes.txt",
            file_type=".txt",
            category="Work",
            original_category="Work",
            confidence_score=0.88,
            status="PROCESSED",
            is_overridden=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        ),
        Email(
            id=str(uuid.uuid4()),
            subject="Family Reunion Dinner This Weekend!",
            body="Hey everyone, don't forget we have our family dinner this weekend at grandma's house. Let me know if you can make it!",
            preview="Hey everyone, don't forget we have our family dinner this weekend at grandma's house...",
            file_name=None,
            file_type=None,
            category="Personal",
            original_category="Personal",
            confidence_score=0.95,
            status="PROCESSED",
            is_overridden=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        ),
        Email(
            id=str(uuid.uuid4()),
            subject="Special Offer: 50% Off All Subscriptions - Limited Time!",
            body="Exclusive deal! Subscribe now and save 50% on all plans. Don't miss out on this clearance discount offer.",
            preview="Exclusive deal! Subscribe now and save 50% on all plans. Don't miss out on this clearance discount...",
            file_name=None,
            file_type=None,
            category="Promotional",
            original_category="Promotional",
            confidence_score=0.94,
            status="PROCESSED",
            is_overridden=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        ),
    ]

    try:
        db.add_all(sample_emails)
        db.commit()
    except Exception:
        db.rollback()
