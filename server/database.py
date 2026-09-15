import hashlib
import hmac
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from server.models import Base, User


def get_password_hash(password: str) -> str:
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), 100000
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not hashed_password or "$" not in hashed_password:
            return False
        salt, stored_hash = hashed_password.split("$", 1)
        key = hashlib.pbkdf2_hmac(
            "sha256", plain_password.encode("utf-8"), bytes.fromhex(salt), 100000
        )
        return hmac.compare_digest(key.hex(), stored_hash)
    except Exception:
        return False


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    users_to_seed = [
        {
            "email": "test@example.com",
            "password": "testpassword",
            "full_name": "Jane Smith (Host)",
            "department": "Engineering",
            "role": "HOST",
            "is_active": True,
        },
        {
            "email": "admin@example.com",
            "password": "adminpassword",
            "full_name": "Admin User",
            "department": "Security & Operations",
            "role": "ADMIN",
            "is_active": True,
        },
        {
            "email": "receptionist@example.com",
            "password": "receptionistpassword",
            "full_name": "Receptionist Alice",
            "department": "Front Desk",
            "role": "RECEPTIONIST",
            "is_active": True,
        },
        {
            "email": "john.host@example.com",
            "password": "hostpassword",
            "full_name": "John Host",
            "department": "Product Management",
            "role": "HOST",
            "is_active": True,
        },
    ]

    for u_data in users_to_seed:
        existing = db.query(User).filter(User.email == u_data["email"]).first()
        if not existing:
            user = User(
                email=u_data["email"],
                hashed_password=get_password_hash(u_data["password"]),
                full_name=u_data["full_name"],
                department=u_data["department"],
                role=u_data["role"],
                is_active=u_data["is_active"],
            )
            db.add(user)
    try:
        db.commit()
    except Exception:
        db.rollback()
