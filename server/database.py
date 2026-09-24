import os
import uuid
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import IntegrityError
import bcrypt

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
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def init_db():
    import server.models.entities  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    from server.models.entities import (
        User,
        Rule,
        Transaction,
        Alert,
        AlertViolation,
        AuditLog,
    )

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    # 1. Seed regular test user (analyst)
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="analyst",
                is_active=True,
                is_verified=True,
                created_at=now,
                updated_at=now,
            )
            db.add(user)
            db.commit()
    except IntegrityError:
        db.rollback()

    # 2. Seed admin user
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                role="admin",
                is_active=True,
                is_verified=True,
                created_at=now,
                updated_at=now,
            )
            db.add(admin)
            db.commit()
    except IntegrityError:
        db.rollback()

    # 3. Seed Default Detection Rules
    default_rules = [
        {
            "id": "11111111-2222-3333-4444-555555555555",
            "name": "High Transaction Amount",
            "rule_type": "AMOUNT_THRESHOLD",
            "description": "Flags any single transaction exceeding the defined monetary threshold (default: $10,000 USD)",
            "parameters": {"threshold_amount": 10000.0, "currency": "USD"},
            "severity": "HIGH",
            "is_active": True,
        },
        {
            "id": "22222222-3333-4444-5555-666666666666",
            "name": "High-Frequency Transaction Velocity",
            "rule_type": "FREQUENCY_VELOCITY",
            "description": "Detects accounts initiating rapid bursts of transactions within a rolling time window (e.g., 5 transactions in 10 minutes)",
            "parameters": {"max_count": 5, "window_seconds": 600},
            "severity": "HIGH",
            "is_active": True,
        },
        {
            "id": "33333333-4444-5555-6666-777777777777",
            "name": "Geographic Velocity (Impossible Travel)",
            "rule_type": "GEOGRAPHIC_VELOCITY",
            "description": "Identifies consecutive transactions from distant geographic coordinates traversed at impossible physical speeds (> 500 mph)",
            "parameters": {
                "speed_threshold_mph": 500.0,
                "max_window_seconds": 3600,
            },
            "severity": "CRITICAL",
            "is_active": True,
        },
    ]

    for rule_data in default_rules:
        try:
            existing_rule = db.query(Rule).filter(Rule.id == rule_data["id"]).first()
            if not existing_rule:
                rule_obj = Rule(
                    id=rule_data["id"],
                    name=rule_data["name"],
                    rule_type=rule_data["rule_type"],
                    description=rule_data["description"],
                    parameters=rule_data["parameters"],
                    severity=rule_data["severity"],
                    is_active=rule_data["is_active"],
                    created_at=now,
                    updated_at=now,
                )
                db.add(rule_obj)
                db.commit()
        except IntegrityError:
            db.rollback()

    # 4. Seed Initial Sample Transaction & Alert for Demo Dashboard
    try:
        sample_tx_id = "7b8f9e20-3b4a-4d6f-9812-789a0b1c2d3e"
        existing_tx = (
            db.query(Transaction).filter(Transaction.id == sample_tx_id).first()
        )
        if not existing_tx:
            # Previous transaction in London
            prev_tx = Transaction(
                id="00000000-1111-2222-3333-444444444444",
                account_id="ACC-982341",
                amount=245.50,
                currency="USD",
                latitude=51.5074,
                longitude=-0.1278,
                location_name="London, UK",
                merchant="Harrods Department Store",
                timestamp=now - datetime.timedelta(minutes=35),
                created_at=now - datetime.timedelta(minutes=35),
            )
            db.add(prev_tx)

            # Suspicious transaction in New York
            tx = Transaction(
                id=sample_tx_id,
                account_id="ACC-982341",
                amount=12500.00,
                currency="USD",
                latitude=40.7128,
                longitude=-74.0060,
                location_name="New York, NY",
                merchant="Global Wire Transfers Inc",
                timestamp=now,
                created_at=now,
            )
            db.add(tx)
            db.commit()

            # Seed Critical Alert
            alert_id = "a9c1e345-6f78-4b90-1234-56789abcdef0"
            alert = Alert(
                id=alert_id,
                transaction_id=sample_tx_id,
                account_id="ACC-982341",
                severity="CRITICAL",
                risk_score=85,
                status="NEW",
                notes=None,
                assigned_to=None,
                created_at=now,
                updated_at=now,
            )
            db.add(alert)
            db.commit()

            # Seed Violations
            v1 = AlertViolation(
                id=str(uuid.uuid4()),
                alert_id=alert_id,
                rule_id="11111111-2222-3333-4444-555555555555",
                rule_name="High Transaction Amount",
                violation_details={
                    "threshold_amount": 10000.00,
                    "actual_amount": 12500.00,
                    "difference": 2500.00,
                    "currency": "USD",
                },
                created_at=now,
            )
            v2 = AlertViolation(
                id=str(uuid.uuid4()),
                alert_id=alert_id,
                rule_id="33333333-4444-5555-6666-777777777777",
                rule_name="Geographic Velocity (Impossible Travel)",
                violation_details={
                    "previous_location": "London, UK (51.5074, -0.1278)",
                    "current_location": "New York, NY (40.7128, -74.0060)",
                    "distance_miles": 3459.2,
                    "time_diff_minutes": 35.0,
                    "implied_speed_mph": 5930.0,
                    "speed_threshold_mph": 500.0,
                },
                created_at=now,
            )
            db.add(v1)
            db.add(v2)

            # Audit log for alert creation
            audit = AuditLog(
                id=str(uuid.uuid4()),
                entity_type="ALERT",
                entity_id=alert_id,
                action="CREATE",
                actor="system-rule-engine",
                changes={
                    "severity": "CRITICAL",
                    "risk_score": 85,
                    "status": "NEW",
                    "triggered_rules": [
                        "High Transaction Amount",
                        "Geographic Velocity (Impossible Travel)",
                    ],
                },
                created_at=now,
            )
            db.add(audit)
            db.commit()
    except IntegrityError:
        db.rollback()
