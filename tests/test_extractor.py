import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from server.database import Base
from server.models import RawSalesOrder
from server.pipeline.extractor import extract_raw_sales_orders


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    # Seed sample raw records
    orders = [
        RawSalesOrder(
            order_id="ord-01",
            customer_id="cust-01",
            customer_email="cust1@example.com",
            order_date=datetime.date(2026, 5, 15),
            amount=120.50,
            currency="USD",
            status="completed",
        ),
        RawSalesOrder(
            order_id="ord-02",
            customer_id="cust-02",
            customer_email="cust2@example.com",
            order_date=datetime.date(2026, 5, 16),
            amount=80.00,
            currency="USD",
            status="pending",
        ),
        RawSalesOrder(
            order_id="ord-03",
            customer_id="cust-03",
            customer_email=None,
            order_date=datetime.date(2026, 5, 17),
            amount=None,
            currency="USD",
            status="completed",
        ),
    ]
    session.add_all(orders)
    session.commit()

    yield session

    session.close()


def test_extract_raw_sales_orders_all(db_session):
    records = extract_raw_sales_orders(db_session, batch_size=10)
    assert len(records) == 3
    assert records[0]["order_id"] == "ord-01"
    assert records[0]["customer_email"] == "cust1@example.com"


def test_extract_raw_sales_orders_date_filter(db_session):
    records = extract_raw_sales_orders(
        db_session,
        start_date=datetime.date(2026, 5, 16),
        end_date=datetime.date(2026, 5, 17),
        batch_size=10,
    )
    assert len(records) == 2
    assert {r["order_id"] for r in records} == {"ord-02", "ord-03"}
