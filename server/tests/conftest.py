"""Pytest configuration and shared fixtures for Garba Management System tests."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from server.database import Base, get_db, seed_data
from server.main import app
from server import models  # noqa: F401

# In-memory SQLite engine with StaticPool for test isolation
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables and seed data once for the test session."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide a clean DB session per test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """Provide a TestClient with dependency override for get_db."""
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
def admin_token(client):
    """Obtain JWT token for admin user."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword"},
    )
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture
def user_token(client):
    """Obtain JWT token for regular attendee user."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert resp.status_code == 200, f"User login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture
def security_token(client):
    """Obtain JWT token for security officer."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "security@example.com", "password": "securitypassword"},
    )
    assert resp.status_code == 200, f"Security login failed: {resp.text}"
    return resp.json()["access_token"]
