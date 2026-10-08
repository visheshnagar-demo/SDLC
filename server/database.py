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
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    from server.models import (
        User,
        Customer,
        SavingsAccount,
        FixedDepositPlan,
        ExchangeRateCache,
    )

    # 1. Seed regular test user
    test_user_id = "user_test_001"
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                id=test_user_id,
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="user",
                transaction_pin="1234",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            test_user_id = user.id
    except IntegrityError:
        db.rollback()
        user = db.query(User).filter(User.email == "test@example.com").first()
        if user:
            test_user_id = user.id

    # 2. Seed admin user
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                id="user_admin_001",
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                role="admin",
                transaction_pin="1234",
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
    except IntegrityError:
        db.rollback()

    # 3. Seed customer profile for test user
    customer_id = "cust_test_001"
    try:
        customer = db.query(Customer).filter(Customer.email == "test@example.com").first()
        if not customer:
            customer = Customer(
                id=customer_id,
                user_id=test_user_id,
                full_name="Verified Retail Customer",
                email="test@example.com",
                kyc_status="VERIFIED",
                transaction_pin="1234",
                is_active=True,
                is_verified=True,
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)
        else:
            customer_id = customer.id
    except IntegrityError:
        db.rollback()
        customer = db.query(Customer).filter(Customer.email == "test@example.com").first()
        if customer:
            customer_id = customer.id

    # 4. Seed savings accounts
    savings_to_seed = [
        {
            "id": "sa_primary_1234",
            "account_number": "XXXX-1234",
            "account_type": "SAVINGS",
            "currency": "USD",
            "balance": 10000.00,
            "status": "ACTIVE",
        },
        {
            "id": "sa_secondary_5678",
            "account_number": "XXXX-5678",
            "account_type": "SAVINGS",
            "currency": "USD",
            "balance": 250.00,
            "status": "ACTIVE",
        },
        {
            "id": "sa_dormant_9999",
            "account_number": "XXXX-9999",
            "account_type": "SAVINGS",
            "currency": "USD",
            "balance": 5000.00,
            "status": "DORMANT",
        },
    ]

    for sa_data in savings_to_seed:
        try:
            sa = db.query(SavingsAccount).filter(SavingsAccount.account_number == sa_data["account_number"]).first()
            if not sa:
                sa = SavingsAccount(
                    id=sa_data["id"],
                    customer_id=customer_id,
                    account_number=sa_data["account_number"],
                    account_type=sa_data["account_type"],
                    currency=sa_data["currency"],
                    balance=sa_data["balance"],
                    status=sa_data["status"],
                )
                db.add(sa)
                db.commit()
        except IntegrityError:
            db.rollback()

    # 5. Seed FD plans
    fd_plans_to_seed = [
        {"tenure_months": 6, "interest_rate": 4.75, "min_deposit_amount": 500.00},
        {"tenure_months": 12, "interest_rate": 5.50, "min_deposit_amount": 500.00},
        {"tenure_months": 24, "interest_rate": 5.80, "min_deposit_amount": 500.00},
        {"tenure_months": 36, "interest_rate": 6.00, "min_deposit_amount": 500.00},
    ]

    for plan_data in fd_plans_to_seed:
        try:
            plan = db.query(FixedDepositPlan).filter(FixedDepositPlan.tenure_months == plan_data["tenure_months"]).first()
            if not plan:
                plan = FixedDepositPlan(
                    id=str(uuid.uuid4()),
                    tenure_months=plan_data["tenure_months"],
                    interest_rate=plan_data["interest_rate"],
                    min_deposit_amount=plan_data["min_deposit_amount"],
                    max_deposit_amount=1000000.00,
                    is_active=True,
                )
                db.add(plan)
                db.commit()
        except IntegrityError:
            db.rollback()

    # 6. Seed initial exchange rates cache
    try:
        cache = (
            db.query(ExchangeRateCache)
            .filter(ExchangeRateCache.base_currency == "USD")
            .first()
        )
        if not cache:
            now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
            cache = ExchangeRateCache(
                id=str(uuid.uuid4()),
                base_currency="USD",
                rates_json='{"USD": 1.0, "EUR": 0.925, "GBP": 0.79, "JPY": 155.0, "CAD": 1.36}',
                fetched_at=now,
                expires_at=now + datetime.timedelta(minutes=15),
            )
            db.add(cache)
            db.commit()
    except IntegrityError:
        db.rollback()
