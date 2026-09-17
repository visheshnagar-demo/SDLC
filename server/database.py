import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

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


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_data(db):
    from server.models import WireTransfer

    existing = db.query(WireTransfer).first()
    if existing:
        return

    sample_wires = [
        WireTransfer(
            beneficiary_name="Acme Corp Global",
            account_number="9876543210",
            routing_number="123456789",
            amount=25000.00,
            status="PENDING",
            created_by="User A",
            approved_by=None,
        ),
        WireTransfer(
            beneficiary_name="Apex Logistics LLC",
            account_number="1122334455",
            routing_number="987654321",
            amount=4500.00,
            status="APPROVED",
            created_by="User A",
            approved_by="System",
        ),
        WireTransfer(
            beneficiary_name="Global Tech Solutions",
            account_number="5566778899",
            routing_number="112233445",
            amount=15000.00,
            status="PENDING",
            created_by="User A",
            approved_by=None,
        ),
    ]

    try:
        for wire in sample_wires:
            db.add(wire)
        db.commit()
    except Exception:
        db.rollback()
