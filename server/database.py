import os
import uuid
import datetime
import hashlib
import hmac
import secrets
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy.exc import IntegrityError

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/warranty_app.db")

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000
    ).hex()
    return f"{salt}${pw_hash}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if "$" not in hashed_password:
            return False
        salt, pw_hash = hashed_password.split("$", 1)
        test_hash = hashlib.pbkdf2_hmac(
            "sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000
        ).hex()
        return hmac.compare_digest(pw_hash, test_hash)
    except Exception:
        return False


def init_db():
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    from server.models import User, Product, Warranty, Claim

    # Seed regular test user
    test_user = None
    try:
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                full_name="Alex Morgan",
                hashed_password=get_password_hash("testpassword"),
                role="user",
                is_active=True,
                is_verified=True,
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
    except IntegrityError:
        db.rollback()
        test_user = db.query(User).filter(User.email == "test@example.com").first()

    # Seed admin user
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                full_name="Admin User",
                hashed_password=get_password_hash("adminpassword"),
                role="admin",
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed sample product and warranty for test user if not existing
    if test_user:
        try:
            existing_prod = (
                db.query(Product).filter(Product.user_id == test_user.id).first()
            )
            if not existing_prod:
                today = datetime.date.today()
                purchase_date = today - datetime.timedelta(days=60)

                product = Product(
                    id=str(uuid.uuid4()),
                    user_id=test_user.id,
                    name="MacBook Pro 16-inch",
                    brand="Apple",
                    category="Electronics",
                    purchase_date=purchase_date,
                    serial_number="C02G10XQMD6M",
                    purchase_price=2000.0,
                    vendor="Apple Store",
                    notes="Primary work machine with AppleCare support",
                )
                db.add(product)
                db.commit()
                db.refresh(product)

                # Active warranty expiring in 10 months
                expiration_date = purchase_date + datetime.timedelta(days=365)
                warranty = Warranty(
                    id=str(uuid.uuid4()),
                    product_id=product.id,
                    coverage_duration_months=12,
                    start_date=purchase_date,
                    expiration_date=expiration_date,
                    coverage_type="Manufacturer",
                    provider_name="AppleCare",
                    status="Active",
                    notes="Includes hardware and limited technical support",
                )
                db.add(warranty)

                # Seed a claim
                claim = Claim(
                    id=str(uuid.uuid4()),
                    product_id=product.id,
                    claim_date=purchase_date + datetime.timedelta(days=30),
                    issue_description="Screen backlight flickering under high load",
                    status="Resolved",
                    service_center="Apple Genius Bar - Downtown",
                    repair_cost=150.0,
                    resolution_notes="Display ribbon cable replaced under manufacturer warranty.",
                )
                db.add(claim)

                # Add a second product expiring in 15 days (for alerts testing)
                expiring_purchase_date = today - datetime.timedelta(days=350)
                product2 = Product(
                    id=str(uuid.uuid4()),
                    user_id=test_user.id,
                    name="Sony WH-1000XM5 Headphones",
                    brand="Sony",
                    category="Audio",
                    purchase_date=expiring_purchase_date,
                    serial_number="SN-SONY-99882",
                    purchase_price=399.0,
                    vendor="Best Buy",
                    notes="Wireless noise cancelling headphones",
                )
                db.add(product2)
                db.commit()
                db.refresh(product2)

                warranty2 = Warranty(
                    id=str(uuid.uuid4()),
                    product_id=product2.id,
                    coverage_duration_months=12,
                    start_date=expiring_purchase_date,
                    expiration_date=expiring_purchase_date
                    + datetime.timedelta(days=365),
                    coverage_type="Standard",
                    provider_name="Sony Electronics",
                    status="Active",
                    notes="Standard 1 year limited warranty",
                )
                db.add(warranty2)
                db.commit()
        except IntegrityError:
            db.rollback()
        except Exception:
            db.rollback()
