"""Pytest test fixtures and configuration."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.auth import create_access_token
from server.database import Base, get_db, seed_data
from server.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _setup_test_database():
    """Create schema and seed baseline data once for test session."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        seed_data(session)
    finally:
        session.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Provides a transactional database session for tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_token():
    """Generate a JWT token for the seeded admin user."""
    return create_access_token(
        data={"sub": "admin@example.com", "role": "admin", "uid": "admin-id"}
    )


@pytest.fixture
def user_token():
    """Generate a JWT token for the seeded read-only user."""
    return create_access_token(
        data={"sub": "test@example.com", "role": "read_only", "uid": "user-id"}
    )


@pytest.fixture
def admin_headers(admin_token):
    """Authorization headers for admin user."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def user_headers(user_token):
    """Authorization headers for read-only user."""
    return {"Authorization": f"Bearer {user_token}"}
