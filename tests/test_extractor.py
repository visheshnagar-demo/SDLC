from datetime import date, datetime, timezone
import pytest

from server.database import Base, engine, SessionLocal
from server.models import RawSalesOrder
from server.pipeline.extractor import PostgresExtractor


@pytest.fixture
def test_db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    # Seed sample orders
    orders = [
        RawSalesOrder(
            order_id="ord_101",
            customer_id="cust_1",
            customer_email="alice@example.com",
            order_date=date(2026, 5, 10),
            amount=100.00,
            currency="USD",
            status="completed",
            created_at=datetime.now(timezone.utc)
        ),
        RawSalesOrder(
            order_id="ord_102",
            customer_id="cust_2",
            customer_email="bob@example.com",
            order_date=date(2026, 5, 15),
            amount=200.50,
            currency="USD",
            status="pending",
            created_at=datetime.now(timezone.utc)
        ),
        RawSalesOrder(
            order_id="ord_103",
            customer_id="cust_3",
            customer_email="invalid_email",
            order_date=date(2026, 5, 20),
            amount=300.00,
            currency="USD",
            status="completed",
            created_at=datetime.now(timezone.utc)
        )
    ]
    session.add_all(orders)
    session.commit()

    yield session

    session.close()


def test_extractor_fetch_all(test_db_session):
    extractor = PostgresExtractor(db_session=test_db_session)
    records = extractor.extract_records()
    assert len(records) == 3
    assert records[0]["order_id"] == "ord_101"
    assert records[0]["amount"] == 100.00


def test_extractor_fetch_with_date_filter(test_db_session):
    extractor = PostgresExtractor(db_session=test_db_session)
    records = extractor.extract_records(
        start_date=date(2026, 5, 12),
        end_date=date(2026, 5, 18)
    )
    assert len(records) == 1
    assert records[0]["order_id"] == "ord_102"


def test_extractor_check_connection(test_db_session):
    extractor = PostgresExtractor(db_session=test_db_session)
    assert extractor.check_connection() is True
