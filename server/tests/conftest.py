import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from server.database import Base, seed_data
from server.main import app
import server.models  # noqa: F401

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_test_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_data(db)
    db.close()
    yield


@pytest.fixture
def client():
    # Patch database engine/SessionLocal in server.database and server.middleware.tenant to use TestingSessionLocal
    import server.database as db_module
    import server.middleware.tenant as mw_module

    orig_session_local = db_module.SessionLocal
    db_module.SessionLocal = TestingSessionLocal
    mw_module.SessionLocal = TestingSessionLocal

    with TestClient(app) as c:
        yield c

    db_module.SessionLocal = orig_session_local
    mw_module.SessionLocal = orig_session_local
