import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///:memory:")

connect_args = {}
poolclass = None

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    if ":memory:" in DATABASE_URL:
        poolclass = StaticPool

engine_kwargs = {"connect_args": connect_args}
if poolclass:
    engine_kwargs["poolclass"] = poolclass

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import server.models  # noqa: F401 - Register models with SQLAlchemy Base
    Base.metadata.create_all(bind=engine)
