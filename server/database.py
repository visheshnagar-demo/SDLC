import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool
from server.config import settings

Base = declarative_base()


def get_engine_url() -> str:
    # Use SQLite for testing or if TESTING is set
    if os.getenv("TESTING", "").lower() in ("true", "1") or os.getenv(
        "DATABASE_URL", ""
    ).startswith("sqlite"):
        return os.getenv("DATABASE_URL", "sqlite:///:memory:")

    # Check if psycopg2 is installed before attempting postgresql connection
    try:
        import psycopg2  # noqa: F401

        return settings.get_database_url()
    except ImportError:
        return os.getenv("DATABASE_URL", "sqlite:///./sales_data.db")


def create_app_engine():
    url = get_engine_url()
    if "sqlite" in url:
        return create_engine(
            url,
            pool_pre_ping=True,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    return create_engine(url, pool_pre_ping=True)


engine = create_app_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_data(db=None):
    """Seed initial data if needed."""
    pass
