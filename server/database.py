import logging
from datetime import date, datetime
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from server.config import settings
from server.models import Base, RawSalesOrder

logger = logging.getLogger(__name__)

# Configure connect_args based on DB dialect
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_data(db: Session) -> None:
    """
    Idempotently seed raw_sales_orders with realistic test data
    including valid records and data quality edge cases (null amounts, invalid emails).
    """
    try:
        existing_count = db.query(RawSalesOrder).count()
        if existing_count > 0:
            return

        sample_orders = [
            # Valid orders
            RawSalesOrder(
                order_id="ORD-1001",
                customer_id="CUST-001",
                customer_email="john.doe@example.com",
                order_date=date(2026, 5, 10),
                amount=149.99,
                currency="USD",
                status="COMPLETED",
                created_at=datetime(2026, 5, 10, 10, 30, 0),
            ),
            RawSalesOrder(
                order_id="ORD-1002",
                customer_id="CUST-002",
                customer_email="jane.smith@enterprise.org",
                order_date=date(2026, 5, 10),
                amount=299.50,
                currency="USD",
                status="COMPLETED",
                created_at=datetime(2026, 5, 10, 11, 15, 0),
            ),
            RawSalesOrder(
                order_id="ORD-1003",
                customer_id="CUST-003",
                customer_email="alice.wonder@domain.co.uk",
                order_date=date(2026, 5, 11),
                amount=89.00,
                currency="USD",
                status="PENDING",
                created_at=datetime(2026, 5, 11, 9, 0, 0),
            ),
            RawSalesOrder(
                order_id="ORD-1004",
                customer_id="CUST-004",
                customer_email="bob.builder@construction.io",
                order_date=date(2026, 5, 12),
                amount=1250.00,
                currency="USD",
                status="COMPLETED",
                created_at=datetime(2026, 5, 12, 14, 20, 0),
            ),
            # Invalid order: Missing / NULL amount
            RawSalesOrder(
                order_id="ORD-2001",
                customer_id="CUST-005",
                customer_email="bad.amount@example.com",
                order_date=date(2026, 5, 10),
                amount=None,
                currency="USD",
                status="PENDING",
                created_at=datetime(2026, 5, 10, 12, 0, 0),
            ),
            # Invalid order: Invalid email format (missing @)
            RawSalesOrder(
                order_id="ORD-2002",
                customer_id="CUST-006",
                customer_email="invalid-email-format.com",
                order_date=date(2026, 5, 11),
                amount=75.50,
                currency="USD",
                status="COMPLETED",
                created_at=datetime(2026, 5, 11, 16, 45, 0),
            ),
            # Invalid order: Missing email (None)
            RawSalesOrder(
                order_id="ORD-2003",
                customer_id="CUST-007",
                customer_email=None,
                order_date=date(2026, 5, 12),
                amount=310.00,
                currency="USD",
                status="COMPLETED",
                created_at=datetime(2026, 5, 12, 18, 0, 0),
            ),
            # Invalid order: Invalid email (missing domain extension)
            RawSalesOrder(
                order_id="ORD-2004",
                customer_id="CUST-008",
                customer_email="user@invalid-domain",
                order_date=date(2026, 5, 12),
                amount=45.00,
                currency="USD",
                status="COMPLETED",
                created_at=datetime(2026, 5, 12, 19, 30, 0),
            ),
        ]

        db.add_all(sample_orders)
        db.commit()
        logger.info(f"Seeded {len(sample_orders)} sample raw sales orders.")
    except Exception as e:
        db.rollback()
        logger.warning(f"Seeding skipped or encountered non-fatal error: {e}")


def init_db(target_engine=None) -> None:
    """
    Initialize schema tables and seed sample data.
    """
    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)

    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
