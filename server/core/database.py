from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import StaticPool
from server.core.config import settings

DATABASE_URL = settings.DATABASE_URL

connect_args = {}
poolclass = None

if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
    if ":memory:" in DATABASE_URL or settings.TESTING:
        poolclass = StaticPool

engine_kwargs = {"connect_args": connect_args}
if poolclass:
    engine_kwargs["poolclass"] = poolclass

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Import all models to register them on Base.metadata
    import server.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from server.services.seed_data import seed_initial_data

        seed_initial_data(db)
    finally:
        db.close()
