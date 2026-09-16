"""Database session and connection management."""
import os
from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from server.models import Base

DEFAULT_DB_URL = "sqlite:///:memory:"


def get_database_url() -> str:
    """Retrieve database URL from environment or fallback to sqlite for testing."""
    return os.getenv("POSTGRES_DB_URL") or os.getenv("DATABASE_URL") or DEFAULT_DB_URL


def get_engine(db_url: str = None):
    """Create SQLAlchemy engine."""
    url = db_url or get_database_url()
    connect_args = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(url, connect_args=connect_args)


def init_db(engine=None):
    """Initialize database tables (used for test setup)."""
    target_engine = engine or get_engine()
    Base.metadata.create_all(bind=target_engine)


@contextmanager
def get_db_session(engine=None) -> Generator[Session, None, None]:
    """Context manager providing a transactional database session."""
    target_engine = engine or get_engine()
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=target_engine)
    session = session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
