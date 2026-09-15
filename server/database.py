import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./emails.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(target_engine=None):
    from server import models  # noqa: F401

    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)


def seed_data(db):
    """Seed initial sample emails and classifications idempotently."""
    import uuid

    from server.models import Classification, Email

    # Check if data already exists
    existing_count = db.query(Email).count()
    if existing_count > 0:
        return

    sample_items = [
        {
            "id": str(uuid.uuid4()),
            "sender": "alerts@monitoring.company.com",
            "subject": "CRITICAL: Database Replication Lag Alert",
            "body_text": "Production database cluster db-primary-01 has detected replication lag exceeding 45 seconds. Immediate investigation required by on-call engineer.",
            "source_type": "TEXT_ENTRY",
            "file_name": None,
            "category": "Urgent",
            "confidence": 98.50,
        },
        {
            "id": str(uuid.uuid4()),
            "sender": "sarah.jenkins@company.com",
            "subject": "Q3 Roadmap Review and Sprint Planning",
            "body_text": "Hi team, please find attached the agenda for our upcoming Q3 product roadmap review scheduled for Thursday at 2 PM. Review the deliverables in advance.",
            "source_type": "TEXT_ENTRY",
            "file_name": None,
            "category": "Work",
            "confidence": 92.00,
        },
        {
            "id": str(uuid.uuid4()),
            "sender": "offers@e-deals.example.com",
            "subject": "Flash Sale! 50% Off Cloud Hosting and Developer Tools",
            "body_text": "Exclusive limited time deal: upgrade your cloud storage and hosting tiers today and receive a 50% discount on annual subscriptions with code DEV50.",
            "source_type": "TEXT_ENTRY",
            "file_name": None,
            "category": "Promotional",
            "confidence": 95.00,
        },
        {
            "id": str(uuid.uuid4()),
            "sender": "alex.family@gmail.com",
            "subject": "Weekend hiking and BBQ plans",
            "body_text": "Hey everyone, we're planning a trip to the national park this Saturday morning followed by a barbecue at our place. Let us know if you can join!",
            "source_type": "TEXT_ENTRY",
            "file_name": None,
            "category": "Personal",
            "confidence": 89.00,
        },
    ]

    for item in sample_items:
        email = Email(
            id=item["id"],
            sender=item["sender"],
            subject=item["subject"],
            body_text=item["body_text"],
            source_type=item["source_type"],
            file_name=item["file_name"],
        )
        db.add(email)
        classification = Classification(
            id=str(uuid.uuid4()),
            email_id=item["id"],
            ai_category=item["category"],
            confidence_score=item["confidence"],
            user_override_category=None,
            is_overridden=False,
        )
        db.add(classification)

    try:
        db.commit()
    except Exception:
        db.rollback()
