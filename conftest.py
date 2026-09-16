import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Ensure server path is in sys.path
server_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server")
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

# Ensure sys.path includes repo root as well
repo_root = os.path.dirname(os.path.abspath(__file__))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

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
    # Patch database engine/SessionLocal in server.database and server.middleware.tenant
    import server.database as db_module
    import server.middleware.tenant as mw_module

    orig_session_local = db_module.SessionLocal
    db_module.SessionLocal = TestingSessionLocal
    mw_module.SessionLocal = TestingSessionLocal

    with TestClient(app) as c:
        yield c

    db_module.SessionLocal = orig_session_local
    mw_module.SessionLocal = orig_session_local
