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
    from server.models import User, ExchangeRateCache

    # Seed regular test user
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="user",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed admin user
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
            )
            db.add(admin)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed initial exchange rates cache
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
