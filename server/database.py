from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from server.config import settings

DATABASE_URL = settings.DATABASE_URL
if settings.TESTING:
    DATABASE_URL = "sqlite:///:memory:"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables and seed initial luxury timepieces and users."""
    Base.metadata.create_all(bind=engine)

    # Run idempotent seeding
    db = SessionLocal()
    try:
        from server.seed_data import seed_data

        seed_data(db)
    finally:
        db.close()
