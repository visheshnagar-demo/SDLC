import os
import uuid
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


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def init_db():
    import server.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    from server.models.user import User
    from server.models.warehouse import Warehouse

    # Seed regular test user
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                full_name="Test User",
                hashed_password=get_password_hash("testpassword"),
                role="inventory_manager",
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

    # Seed default warehouse
    try:
        wh = db.query(Warehouse).filter(Warehouse.code == "WH-MAIN").first()
        if not wh:
            wh = Warehouse(
                id=str(uuid.uuid4()),
                code="WH-MAIN",
                name="Main Warehouse",
                location="Building A, Central Hub",
            )
            db.add(wh)
            db.commit()
    except IntegrityError:
        db.rollback()
