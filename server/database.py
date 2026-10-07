from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from server.config import settings
from server.models import Base

database_url = settings.DATABASE_URL
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
