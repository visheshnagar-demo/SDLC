import os
import uuid
from datetime import datetime
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./emails.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

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
    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    from server.models import Email, ClassificationAuditLog

    try:
        existing_count = db.query(Email).count()
        if existing_count > 0:
            return

        sample_emails = [
            {
                "id": str(uuid.uuid4()),
                "subject": "URGENT: Production Server SSL Certificate Expiring in 24h",
                "body": "Critical alert: The wildcard SSL certificate for *.production.corp expires in 24 hours. Immediate renewal required to prevent service downtime.",
                "preview": "Critical alert: The wildcard SSL certificate for *.production.corp expires in 24 hours...",
                "file_name": "ssl_alert.eml",
                "file_type": "message/rfc822",
                "category": "Urgent",
                "original_category": "Urgent",
                "confidence_score": 0.94,
                "status": "PROCESSED",
                "is_overridden": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            },
            {
                "id": str(uuid.uuid4()),
                "subject": "Sprint Planning and Architecture Review for Q3",
                "body": "Hi Team, let's schedule our sprint planning and architecture sync for Wednesday 10 AM. Please prepare your task estimates and Jira updates.",
                "preview": "Hi Team, let's schedule our sprint planning and architecture sync for Wednesday 10 AM...",
                "file_name": "sprint_review.txt",
                "file_type": "text/plain",
                "category": "Work",
                "original_category": "Work",
                "confidence_score": 0.88,
                "status": "PROCESSED",
                "is_overridden": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            },
            {
                "id": str(uuid.uuid4()),
                "subject": "Special 50% Off Cloud Hosting Promotion!",
                "body": "Exclusive offer for developers! Upgrade to our Enterprise Cloud Plan today and receive 50% discount for the next 12 months. Unsubscribe here.",
                "preview": "Exclusive offer for developers! Upgrade to our Enterprise Cloud Plan today...",
                "file_name": "promo_deal.eml",
                "file_type": "message/rfc822",
                "category": "Promotional",
                "original_category": "Promotional",
                "confidence_score": 0.91,
                "status": "PROCESSED",
                "is_overridden": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            },
            {
                "id": str(uuid.uuid4()),
                "subject": "Family Weekend Dinner and Birthday Party",
                "body": "Hey, we are planning a birthday dinner and weekend family gathering this Saturday at 6 PM. Hope you can join us for coffee and cake!",
                "preview": "Hey, we are planning a birthday dinner and weekend family gathering this Saturday...",
                "file_name": "family_invite.txt",
                "file_type": "text/plain",
                "category": "Personal",
                "original_category": "Personal",
                "confidence_score": 0.89,
                "status": "PROCESSED",
                "is_overridden": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            },
        ]

        for item in sample_emails:
            email_obj = Email(**item)
            db.add(email_obj)
            db.flush()
            audit = ClassificationAuditLog(
                id=str(uuid.uuid4()),
                email_id=email_obj.id,
                previous_category=None,
                new_category=email_obj.category,
                action="INITIAL_CLASSIFICATION",
                reason="Initial automated AI categorization",
                created_at=datetime.utcnow(),
            )
            db.add(audit)

        db.commit()
    except Exception:
        db.rollback()
