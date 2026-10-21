import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set TESTING environment variable before importing app
os.environ["TESTING"] = "true"

from server.database import Base, get_db, seed_data
from server.main import app
from server.services.auth_service import create_access_token

# Shared test engine using SQLite in-memory with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_headers():
    token = create_access_token(
        data={
            "sub": "admin@example.com",
            "role": "ADMIN",
            "full_name": "Hospital Administrator",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def receptionist_headers():
    token = create_access_token(
        data={
            "sub": "test@example.com",
            "role": "RECEPTIONIST",
            "full_name": "Test Staff",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def doctor_headers():
    token = create_access_token(
        data={
            "sub": "doctor@example.com",
            "role": "DOCTOR",
            "full_name": "Dr. Marcus Smith",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient_headers():
    token = create_access_token(
        data={
            "sub": "patient@example.com",
            "role": "PATIENT",
            "full_name": "Patient User",
        }
    )
    return {"Authorization": f"Bearer {token}"}
