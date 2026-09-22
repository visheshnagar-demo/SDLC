"""Shared test configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.database import get_db, init_db, seed_data
from server.main import app
from server.models import Base
from server.security import create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables and seed default users once for the session."""
    init_db(engine_to_use=test_engine)
    db = TestingSessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide a database session for a test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token_headers():
    """Return authorization header with an Admin user JWT."""
    token = create_access_token(
        data={"sub": "admin-id", "email": "admin@example.com", "role": "ADMIN"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def readonly_token_headers():
    """Return authorization header with a Read-Only user JWT."""
    token = create_access_token(
        data={"sub": "readonly-id", "email": "test@example.com", "role": "READ_ONLY"}
    )
    return {"Authorization": f"Bearer {token}"}
